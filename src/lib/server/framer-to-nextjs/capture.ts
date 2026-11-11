import { FetchFailureReason } from "../utils/enum";
import { FetchSuccess } from "../utils/interface";
import { logger } from "../utils/logger";
import { safeFetch } from "../utils/safe-fetch";
import framerConfig from "./config";
import { CaptureIssueType, ConversionErrorCode, MirroredFileKind } from "./enum";
import { ConversionError } from "./error";
import { framerSite } from "./framer";
import {
  ICaptureIssue,
  ICapturedPage,
  ICaptureResult,
  IFetchedMirrorFile,
  IHeldPage,
  IImageVariant,
  IImageVariantIndex,
  IMirrorTarget,
  IPageRewriteOptions,
  IRobotsRule,
  IRuntimeStubs,
  ISnapshotSink,
} from "./interface";
import { browserPass } from "./browser-pass";
import { mirrorRewriter } from "./mirror";
import { referenceScanner } from "./references";
import { runtimeFiles } from "./runtime";
import { imageVariants } from "./variants";

// One capture of one site. Holds the crawl's state, so each capture gets
// its own instance.
class CaptureRun {
  private readonly startUrl: URL;
  private origin = "";

  private readonly pageQueue: URL[] = [];
  private readonly claimedRoutes = new Set<string>();
  private readonly pages: ICapturedPage[] = [];
  private hasBadgeContainer = false;

  private readonly fileQueue: IMirrorTarget[] = [];
  private readonly claimedFiles = new Set<string>();
  // Pages, text and CMS files are rewritten once everything has been
  // fetched, because the rewrite depends on what was found: the stubs, and
  // which image sizes exist.
  private readonly heldPages: IHeldPage[] = [];
  private readonly heldFiles: IFetchedMirrorFile[] = [];

  private readonly variantQueue: IImageVariant[] = [];
  private readonly capturedVariants: IImageVariant[] = [];
  private readonly variantIndex: IImageVariantIndex = new Map();
  private readonly stubs: IRuntimeStubs = {
    editorSpecifiers: new Set(),
    badgeModules: new Set(),
  };

  private readonly contentTypes: Record<string, string> = {};
  private thumbnail: Buffer | null = null;
  private robots: IRobotsRule[] | null = null;
  private readonly issues: ICaptureIssue[] = [];
  private readonly reportedLimits = new Set<CaptureIssueType>();
  private fileCount = 0;
  private totalBytes = 0;

  constructor(
    input: string,
    private readonly sink: ISnapshotSink,
  ) {
    const withScheme = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    if (!URL.canParse(withScheme)) {
      throw new ConversionError(ConversionErrorCode.InvalidUrl, "That isn't a valid URL.");
    }
    this.startUrl = new URL(withScheme);
  }

  public async execute(): Promise<ICaptureResult> {
    const home = await safeFetch.get(this.startUrl);
    if (!home.ok) throw this.unreachableError(home.reason);

    const homeHtml = home.body.toString("utf8");
    if (!this.isHtml(home) || !framerSite.isFramerPage(homeHtml)) {
      throw new ConversionError(
        ConversionErrorCode.NotFramerSite,
        "That URL isn't a published Framer site.",
      );
    }

    // Redirects (e.g. to a custom domain) decide the site's real origin.
    this.origin = home.url.origin;
    logger.info("Framer capture started", { url: home.url.href });

    const homePage = this.toPageUrl(home.url) ?? new URL("/", this.origin);
    this.claimedRoutes.add(homePage.pathname);
    this.holdPage(homePage, home);

    await this.seedFromSitemaps();
    await this.captureRobots();
    await this.seedFromSearchIndex(homeHtml, home.url);
    await this.captureNotFoundPage();
    await this.drain(this.pageQueue, framerConfig.pageConcurrency, (url) =>
      this.capturePage(url),
    );
    await this.drainFiles();

    await this.runBrowserPass(homePage, homeHtml);
    await this.drainFiles();

    await this.writeHeldFiles();
    await this.writeHeldPages();

    const result: ICaptureResult = {
      siteUrl: home.url.href,
      pages: this.pages.sort((a, b) => a.route.localeCompare(b.route)),
      fileCount: this.fileCount,
      totalBytes: this.totalBytes,
      issues: this.issues,
      thumbnail: this.thumbnail,
      robots: this.robots,
      contentTypes: this.contentTypes,
    };
    logger.info("Framer capture finished", {
      url: result.siteUrl,
      pages: result.pages.length,
      files: result.fileCount,
      bytes: result.totalBytes,
      issues: result.issues.length,
    });
    return result;
  }

  // ----- Pages -----

  private async seedFromSitemaps() {
    const queue = [new URL(framerConfig.sitemapPath, this.origin)];
    const seen = new Set<string>();

    while (queue.length && seen.size < framerConfig.maxSitemaps) {
      const sitemapUrl = queue.shift()!;
      if (seen.has(sitemapUrl.href)) continue;
      seen.add(sitemapUrl.href);

      // Optional: links and the search index still find the pages.
      const response = await safeFetch.get(sitemapUrl);
      if (!response.ok) continue;

      const entries = referenceScanner.sitemapEntries(
        response.body.toString("utf8"),
        response.url,
      );
      entries.pages.forEach((url) => this.enqueuePage(url));
      queue.push(...entries.sitemaps.filter((url) => url.origin === this.origin));
    }
  }

  // Optional: a site without one allows every crawler.
  private async captureRobots() {
    const response = await safeFetch.get(new URL(framerConfig.robotsPath, this.origin));
    if (!response.ok || !response.contentType.toLowerCase().startsWith("text/plain")) return;
    this.robots = referenceScanner.robotsRules(response.body.toString("utf8"));
  }

  private async seedFromSearchIndex(homeHtml: string, homeUrl: URL) {
    const indexUrl = framerSite.searchIndexUrl(homeHtml, homeUrl);
    if (!indexUrl) return;

    const response = await safeFetch.get(indexUrl);
    if (!response.ok) return;

    for (const route of referenceScanner.searchIndexRoutes(response.body.toString("utf8"))) {
      this.enqueuePage(new URL(route, this.origin));
    }
  }

  // Framer serves its 404 page, with a 404 status, for any unknown path.
  private async captureNotFoundPage() {
    if (this.claimedRoutes.has(framerConfig.notFoundRoute)) return;

    const response = await safeFetch.get(
      new URL(framerConfig.notFoundProbePath, this.origin),
      { acceptErrorStatus: true },
    );
    if (!response.ok || response.status !== 404 || !this.isHtml(response)) return;
    if (!framerSite.isFramerPage(response.body.toString("utf8"))) return;

    this.claimedRoutes.add(framerConfig.notFoundRoute);
    this.holdPage(new URL(framerConfig.notFoundRoute, this.origin), response);
  }

  private async capturePage(url: URL) {
    const response = await safeFetch.get(url);
    if (!response.ok || !this.isHtml(response)) {
      this.issues.push({
        type: CaptureIssueType.PageUnavailable,
        url: url.href,
        detail: response.ok ? `Not HTML: ${response.contentType}` : this.describeFailure(response),
      });
      return;
    }

    // A redirect to another page is captured once, under its own route.
    const finalUrl = this.toPageUrl(response.url);
    if (!finalUrl) return;
    if (finalUrl.pathname !== url.pathname) {
      if (!this.claimRoute(finalUrl.pathname)) return;
    }

    this.holdPage(finalUrl, response);
  }

  private holdPage(url: URL, response: FetchSuccess) {
    const file = this.pageFile(url.pathname);
    if (!file) {
      this.issues.push({ type: CaptureIssueType.FileSkipped, url: url.href });
      return;
    }

    const html = response.body.toString("utf8");
    referenceScanner.pageLinks(html, url).forEach((link) => this.enqueuePage(link));
    this.enqueueMirroredUrls(html);
    if (html.includes("__framer-badge-container")) this.hasBadgeContainer = true;

    this.heldPages.push({ route: url.pathname, file, status: response.status, body: response.body });
  }

  private async writeHeldPages() {
    const options: IPageRewriteOptions = {
      removeBadge: this.stubs.badgeModules.size > 0,
      editorSpecifiers: this.stubs.editorSpecifiers,
      resolveImage: (servedUrl) => imageVariants.resolve(servedUrl, this.variantIndex),
      imageManifest: imageVariants.manifest(this.capturedVariants),
    };

    for (const page of this.heldPages) {
      const rewritten = mirrorRewriter.rewritePage(page.body.toString("latin1"), options);
      const written = await this.write(page.file, Buffer.from(rewritten, "latin1"));
      if (written) this.pages.push({ route: page.route, file: page.file, status: page.status });
    }
  }

  // ----- Runtime-only files -----

  private async runBrowserPass(homePage: URL, homeHtml: string) {
    const pages = this.heldPages
      .filter((page) => page.status === 200)
      .map((page) => new URL(page.route, this.origin))
      .sort((a, b) => Number(b.href === homePage.href) - Number(a.href === homePage.href));

    const result = await browserPass.run(this.origin, pages, homeHtml);
    if (result.unavailableReason) {
      logger.warn("Browser pass unavailable", { reason: result.unavailableReason });
      this.issues.push({
        type: CaptureIssueType.BrowserPassUnavailable,
        detail: result.unavailableReason,
      });
      return;
    }

    this.thumbnail = result.screenshot;
    for (const { url, reason } of result.failedPages) {
      this.issues.push({ type: CaptureIssueType.BrowserPassPageFailed, url, detail: reason });
    }
    for (const url of result.urls) {
      this.enqueueFile(url);
      this.enqueueImageRequest(url);
    }
    logger.info("Browser pass finished", {
      pages: pages.length,
      urls: result.urls.length,
      failedPages: result.failedPages.length,
    });
  }

  private enqueuePage(url: URL) {
    const page = this.toPageUrl(url);
    if (page && this.claimRoute(page.pathname)) this.pageQueue.push(page);
  }

  private claimRoute(route: string): boolean {
    if (this.claimedRoutes.has(route)) return false;
    if (this.claimedRoutes.size >= framerConfig.maxPages) {
      this.reportLimit(CaptureIssueType.PageLimitReached);
      return false;
    }
    this.claimedRoutes.add(route);
    return true;
  }

  // The canonical form of a same-site page URL: no query, hash or trailing
  // slash. Null for other sites and for files.
  private toPageUrl(url: URL): URL | null {
    if (url.origin !== this.origin) return null;
    if (framerConfig.nonPageExtensions.test(url.pathname)) return null;

    const page = new URL(url.pathname, this.origin);
    if (page.pathname.length > 1) page.pathname = page.pathname.replace(/\/+$/, "");
    return page;
  }

  // "/" -> "index.html", "/project/flux" -> "project/flux.html".
  private pageFile(route: string): string | null {
    if (route === "/") return framerConfig.indexFile;

    let decoded: string;
    try {
      decoded = decodeURIComponent(route);
    } catch {
      return null;
    }
    const segments = decoded.split("/").slice(1);
    if (segments.some((s) => s === "" || s === "." || s === ".." || /[\\\0]/.test(s))) {
      return null;
    }
    return `${segments.join("/")}${framerConfig.pageFileExtension}`;
  }

  // ----- Files -----

  private enqueueMirroredUrls(text: string) {
    referenceScanner.mirroredUrls(text).forEach((url) => this.enqueueFile(url));
    referenceScanner.imageRequests(text).forEach((url) => this.enqueueImageRequest(url));
  }

  private enqueueImageRequest(url: URL) {
    const variant = imageVariants.fromUrl(url);
    if (!variant || !this.claimFile(variant.path)) return;
    this.variantQueue.push(variant);
  }

  private enqueueFile(url: URL) {
    const target = mirrorRewriter.target(url);
    if (!target || !this.claimFile(target.path)) return;
    this.fileQueue.push(target);
  }

  private claimFile(path: string): boolean {
    if (this.claimedFiles.has(path)) return false;
    if (this.claimedFiles.size >= framerConfig.maxFiles) {
      this.reportLimit(CaptureIssueType.FileLimitReached);
      return false;
    }
    this.claimedFiles.add(path);
    return true;
  }

  // Files lead to more files and image sizes, so both queues are drained
  // until neither grows.
  private async drainFiles() {
    while (this.fileQueue.length || this.variantQueue.length) {
      await Promise.all([
        this.drain(this.fileQueue, framerConfig.fileConcurrency, (target) =>
          this.captureFile(target),
        ),
        this.drain(this.variantQueue, framerConfig.fileConcurrency, (variant) =>
          this.captureVariant(variant),
        ),
      ]);
    }
  }

  // A size that can't be fetched isn't an error: pages keep pointing at the
  // original file, which the host serves for any query.
  private async captureVariant(variant: IImageVariant) {
    const response = await safeFetch.get(variant.fetchUrl, {
      accept: framerConfig.imageVariants.accept,
    });
    const isExpectedType =
      response.ok &&
      response.contentType.toLowerCase().startsWith(framerConfig.imageVariants.mimeType);
    if (!response.ok || !isExpectedType) {
      logger.debug("Image variant unavailable", { url: variant.fetchUrl.href });
      return;
    }

    if (!(await this.write(variant.file, response.body))) return;
    this.capturedVariants.push(variant);
    this.variantIndex.set(imageVariants.key(variant.sourcePath, variant.size), variant.path);
  }

  private async captureFile(requested: IMirrorTarget) {
    const response = await safeFetch.get(requested.url);
    if (!response.ok) {
      this.issues.push({
        type: CaptureIssueType.FileUnavailable,
        url: requested.url.href,
        detail: this.describeFailure(response),
      });
      return;
    }

    const target = this.settleKind(requested, response);
    if (target.kind === MirroredFileKind.Media) {
      await this.write(target.file, response.body);
      return;
    }

    const text = response.body.toString("latin1");
    this.enqueueMirroredUrls(text);
    if (target.isModule) this.scanModule(text, response.url);
    this.heldFiles.push({ ...target, body: response.body });
  }

  // A file whose extension said nothing (e.g. "Icon.js@0.0.28") but which
  // was served as JavaScript is a module: it is scanned and rewritten, and
  // reported so hosting serves it as JavaScript too.
  private settleKind(target: IMirrorTarget, response: FetchSuccess): IMirrorTarget {
    const isJavascript = response.contentType.toLowerCase().includes("javascript");
    if (target.kind !== MirroredFileKind.Media || !isJavascript) return target;

    this.contentTypes[target.path] = framerConfig.javascriptMimeType;
    return { ...target, kind: MirroredFileKind.Text, isModule: true };
  }

  private scanModule(code: string, moduleUrl: URL) {
    for (const reference of referenceScanner.moduleReferences(code, moduleUrl)) {
      if (framerSite.isEditorModule(reference)) {
        this.stubs.editorSpecifiers.add(reference.href);
      } else {
        this.enqueueFile(reference);
      }
    }

    const badge = framerSite.badgeModuleUrl(code, moduleUrl);
    if (badge) this.stubs.badgeModules.add(badge.href);
  }

  private async writeHeldFiles() {
    if (this.stubs.editorSpecifiers.size) {
      await this.write(
        runtimeFiles.editorStubPath().slice(1),
        Buffer.from(runtimeFiles.editorStub()),
      );
    }

    for (const file of this.heldFiles) {
      if (this.stubs.badgeModules.has(file.url.href)) {
        await this.write(file.file, Buffer.from(runtimeFiles.badgeStub()));
        continue;
      }

      const source = file.body.toString("latin1");
      const rewritten = file.isModule
        ? mirrorRewriter.rewriteModule(source, this.stubs.editorSpecifiers)
        : mirrorRewriter.rewriteUrls(source);
      await this.write(file.file, Buffer.from(rewritten, "latin1"));
    }

    if (this.hasBadgeContainer && this.stubs.badgeModules.size === 0) {
      this.issues.push({ type: CaptureIssueType.BadgeNotStubbed });
    }
  }

  // ----- Shared -----

  private async write(file: string, body: Buffer): Promise<boolean> {
    if (this.fileCount >= framerConfig.maxFiles) {
      this.reportLimit(CaptureIssueType.FileLimitReached);
      return false;
    }
    if (this.totalBytes + body.length > framerConfig.maxTotalBytes) {
      this.reportLimit(CaptureIssueType.SizeLimitReached);
      return false;
    }
    await this.sink.write(file, body);
    this.fileCount += 1;
    this.totalBytes += body.length;
    return true;
  }

  // Runs `work` over a queue that grows while it runs, `concurrency` at a
  // time, until the queue is empty and nothing is in flight.
  private async drain<T>(
    queue: T[],
    concurrency: number,
    work: (item: T) => Promise<void>,
  ) {
    const active = new Set<Promise<void>>();
    while (queue.length || active.size) {
      while (queue.length && active.size < concurrency) {
        const task: Promise<void> = work(queue.shift()!).finally(() =>
          active.delete(task),
        );
        active.add(task);
      }
      await Promise.race(active);
    }
  }

  private reportLimit(type: CaptureIssueType) {
    if (this.reportedLimits.has(type)) return;
    this.reportedLimits.add(type);
    this.issues.push({ type });
  }

  private isHtml(response: FetchSuccess): boolean {
    return response.contentType.toLowerCase().includes("text/html");
  }

  private describeFailure(failure: { reason: FetchFailureReason; status?: number }) {
    return failure.status ? `${failure.reason} (${failure.status})` : failure.reason;
  }

  private unreachableError(reason: FetchFailureReason): ConversionError {
    if (reason === FetchFailureReason.InvalidUrl || reason === FetchFailureReason.BlockedAddress) {
      return new ConversionError(
        ConversionErrorCode.InvalidUrl,
        "That URL can't be converted. Use the public address of a published Framer site.",
      );
    }
    return new ConversionError(
      ConversionErrorCode.SiteUnreachable,
      "We couldn't load that site. Check that it's published and try again.",
    );
  }
}

// Downloads a published Framer site, with every file its pages and runtime
// load, into a static site that no longer depends on Framer's servers.
class SiteCapture {
  public async capture(url: string, sink: ISnapshotSink): Promise<ICaptureResult> {
    return new CaptureRun(url, sink).execute();
  }
}

export const siteCapture = new SiteCapture();
