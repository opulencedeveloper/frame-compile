import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
  type Route,
} from "playwright-core";
import config from "../config";
import { FetchResult } from "../utils/interface";
import { safeFetch } from "../utils/safe-fetch";
import framerConfig from "./config";
import { framerSite } from "./framer";
import { IBrowserPassResult } from "./interface";
import { runtimeFiles } from "./runtime";

const settings = framerConfig.browserPass;

// Scripts run inside the page. They are strings rather than functions so
// no build tool can rewrite them with helpers that only exist in Node.

// Scrolling triggers lazy images, appear effects and lazy components.
const SCROLL_THROUGH_PAGE = `(async () => {
  for (let y = 0; y < document.documentElement.scrollHeight; y += ${settings.scrollStepPx}) {
    window.scrollTo(0, y);
    await new Promise((resolve) => setTimeout(resolve, ${settings.scrollDelayMs}));
  }
  window.scrollTo(0, 0);
})()`;

// Every candidate in each srcset, not only the one this viewport and pixel
// density picked: other screens pick the others.
const COLLECT_MEDIA_URLS = `(() => {
  const urls = [];
  const add = (value) => {
    if (URL.canParse(value, location.href)) urls.push(new URL(value, location.href).href);
  };
  for (const element of document.querySelectorAll("img, source, link")) {
    for (const name of ["src", "href"]) {
      const value = element.getAttribute(name);
      if (value) add(value);
    }
    for (const name of ["srcset", "imagesrcset"]) {
      for (const candidate of (element.getAttribute(name) || "").split(",")) {
        const value = candidate.trim().split(/\\s+/)[0];
        if (value) add(value);
      }
    }
  }
  return urls;
})()`;

// One browser pass over one site.
class BrowserPassRun {
  private readonly found = new Map<string, URL>();
  // Reasons by page URL.
  private readonly failedPages = new Map<string, string>();
  // Pages share most of their files; each is fetched once per Accept header.
  private readonly responses = new Map<string, Promise<FetchResult>>();

  constructor(
    private readonly origin: string,
    private readonly pages: URL[],
    private readonly widths: number[],
  ) {}

  public async execute(): Promise<IBrowserPassResult> {
    const browser = await chromium
      .launch({
        executablePath: config.browser.executablePath,
        headless: true,
        args: settings.launchArgs,
      })
      .catch((error: Error) => error);
    if (browser instanceof Error) {
      return { urls: [], failedPages: [], screenshot: null, unavailableReason: browser.message };
    }

    try {
      const contexts = await Promise.all(
        this.widths.map((width) => this.createContext(browser, width)),
      );
      const visits = contexts.flatMap((context) =>
        this.pages.map((page) => () => this.visit(context, page)),
      );
      await this.runAll(visits);
      await Promise.all(contexts.map((context) => context.close()));
      // The home page comes first.
      const screenshot = this.pages[0] ? await this.screenshot(browser, this.pages[0]) : null;

      return {
        urls: [...this.found.values()],
        failedPages: [...this.failedPages].map(([url, reason]) => ({ url, reason })),
        screenshot,
      };
    } finally {
      await browser.close();
    }
  }

  // The page as a desktop visitor first sees it, for the dashboard's
  // thumbnail. Unlike the discovery visits, images and fonts load. A page
  // that can't be captured simply has no thumbnail.
  private async screenshot(browser: Browser, url: URL): Promise<Buffer | null> {
    const shot = settings.thumbnail;
    const context = await browser.newContext({
      viewport: { width: shot.width, height: shot.height },
      serviceWorkers: "block",
      acceptDownloads: false,
    });
    await context.route("**/*", (route) => this.handle(route, true));
    const page = await context.newPage();

    const image = await page
      .goto(url.href, { waitUntil: "load", timeout: settings.navigationTimeoutMs })
      .then(() => page.waitForLoadState("networkidle", { timeout: settings.settleTimeoutMs }).catch(() => undefined))
      // The badge is removed from converted sites, so not pictured either.
      .then(() => page.addStyleTag({ content: runtimeFiles.badgeStyle() }))
      // Appear animations finish before the picture is taken.
      .then(() => page.waitForTimeout(shot.settleMs))
      .then(() => page.screenshot({ type: "jpeg", quality: shot.quality }))
      .catch(() => null);
    await context.close();
    return image;
  }

  private async createContext(browser: Browser, width: number): Promise<BrowserContext> {
    // Phones get touch and mobile emulation, which some components check.
    const isPhone = width <= settings.phoneWidth;
    const context = await browser.newContext({
      viewport: { width, height: settings.viewportHeight },
      isMobile: isPhone,
      hasTouch: isPhone,
      serviceWorkers: "block",
      acceptDownloads: false,
    });
    await context.route("**/*", (route) => this.handle(route));
    return context;
  }

  // A page that fails (a timeout, a redirect while a script runs) is
  // reported and the other pages still run.
  private async visit(context: BrowserContext, url: URL) {
    const page = await context.newPage();
    await this.inspect(page, url)
      .catch((error: Error) => this.failedPages.set(url.href, error.message))
      .finally(() => page.close());
  }

  private async inspect(page: Page, url: URL) {
    await page.goto(url.href, { waitUntil: "load", timeout: settings.navigationTimeoutMs });
    await page.evaluate(SCROLL_THROUGH_PAGE);
    // Busy pages (video, polling embeds) never go quiet; the wait is capped.
    await page
      .waitForLoadState("networkidle", { timeout: settings.settleTimeoutMs })
      .catch(() => undefined);

    const referenced: unknown = await page.evaluate(COLLECT_MEDIA_URLS);
    if (!Array.isArray(referenced)) return;
    for (const href of referenced) {
      if (typeof href === "string" && URL.canParse(href)) this.record(new URL(href));
    }
  }

  // Every request goes through the SSRF-safe fetcher, so the browser never
  // reaches the network itself, and only the site and the mirrored hosts
  // are allowed.
  private async handle(route: Route, loadMedia = false) {
    const request = route.request();
    const url = new URL(request.url());
    this.record(url);

    const isAllowed =
      request.method() === "GET" &&
      this.isAllowed(url) &&
      (loadMedia || !settings.recordOnlyResourceTypes.includes(request.resourceType()));
    if (!isAllowed) {
      await route.abort().catch(() => undefined);
      return;
    }

    const response = await this.fetch(url, request.headers().accept);
    // The page may have closed while the file was fetched; nothing is
    // waiting for the answer then.
    if (!response.ok) {
      await route.abort().catch(() => undefined);
      return;
    }
    await route
      .fulfill({ status: response.status, contentType: response.contentType, body: response.body })
      .catch(() => undefined);
  }

  private fetch(url: URL, accept = "*/*"): Promise<FetchResult> {
    const key = `${url.href} ${accept}`;
    let response = this.responses.get(key);
    if (!response) {
      response = safeFetch.get(url, { acceptErrorStatus: true, accept });
      this.responses.set(key, response);
    }
    return response;
  }

  private record(url: URL) {
    if (this.isMirrored(url)) this.found.set(url.href, url);
  }

  private isAllowed(url: URL): boolean {
    return url.origin === this.origin || this.isMirrored(url);
  }

  private isMirrored(url: URL): boolean {
    return (
      framerConfig.mirroredPrefixes.some((prefix) => url.href.startsWith(prefix)) &&
      !framerSite.isEditorModule(url)
    );
  }

  private async runAll(tasks: (() => Promise<void>)[]) {
    const queue = [...tasks];
    const worker = async () => {
      for (let task = queue.shift(); task; task = queue.shift()) await task();
    };
    await Promise.all(Array.from({ length: settings.concurrency }, worker));
  }
}

// Loads the original site in headless Chromium to find the files its
// runtime only requests while it runs, such as icons whose file names are
// built from component props.
class BrowserPass {
  public async run(origin: string, pages: URL[], homeHtml: string): Promise<IBrowserPassResult> {
    const widths = framerSite.breakpointWidths(homeHtml);
    return new BrowserPassRun(origin, this.choosePages(pages), widths).execute();
  }

  // The home page, then one page per section in turn (/blog/a, /work/b,
  // /blog/c, ...), so a capped pass still covers every page template.
  private choosePages(pages: URL[]): URL[] {
    const sections = new Map<string, URL[]>();
    for (const page of pages) {
      const section = page.pathname.split("/")[1] ?? "";
      sections.set(section, [...(sections.get(section) ?? []), page]);
    }

    const chosen: URL[] = [];
    const lists = [...sections.values()];
    for (let index = 0; chosen.length < settings.maxPages; index++) {
      const round = lists.map((list) => list[index]).filter((page): page is URL => !!page);
      if (round.length === 0) break;
      chosen.push(...round.slice(0, settings.maxPages - chosen.length));
    }
    return chosen;
  }
}

export const browserPass = new BrowserPass();
