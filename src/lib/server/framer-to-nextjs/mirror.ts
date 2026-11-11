import framerConfig from "./config";
import { MirroredFileKind } from "./enum";
import { IMirrorTarget, IPageRewriteOptions } from "./interface";
import { runtimeFiles } from "./runtime";

const IMAGE_TAG = /<(?:img|source)\b[^>]*>|<link\b[^>]*\brel=["']?preload\b[^>]*>/gi;

// A served image URL with its query, as written in an attribute: up to the
// quote, the space before a srcset width, or the comma between candidates.
const SERVED_IMAGE_URL = new RegExp(
  `${(framerConfig.mirrorPrefix + framerConfig.imageVariants.urlPrefix.slice(framerConfig.absolutePrefix.length)).replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}[^\\s"'<>?,]+\\?[^\\s"'<>,]+`,
  "g",
);

// Maps files on Framer's hosts to paths on the converted site, and rewrites
// pages and files to load them from there.
//
// Files are rewritten as latin1 strings: every byte maps to one character
// and back, so everything except the replaced URLs stays byte-identical,
// including Framer's hydration markers and binary CMS data.
class MirrorRewriter {
  constructor() {
    // Equal lengths are what make rewriting binary CMS data safe.
    if (
      framerConfig.mirrorPrefix.length !== framerConfig.absolutePrefix.length ||
      framerConfig.escapedMirrorPrefix.length !== framerConfig.escapedAbsolutePrefix.length
    ) {
      throw new Error("Mirror prefixes must be as long as the URL prefixes they replace");
    }
  }

  // Where a URL is served from on the converted site, or null if it isn't
  // mirrored or its path can't be stored safely.
  public target(url: URL): IMirrorTarget | null {
    if (!framerConfig.mirroredPrefixes.some((prefix) => url.href.startsWith(prefix))) {
      return null;
    }

    const decodedPath = this.decodePath(url.pathname);
    if (!decodedPath) return null;

    const fileName = decodedPath.slice(decodedPath.lastIndexOf("/") + 1);
    const dot = fileName.lastIndexOf(".");
    // Directories and extensionless prefixes (".../images/") aren't files.
    if (dot <= 0) return null;
    // Unknown extensions (e.g. "Icon.js@0.0.28") are settled by the
    // response's content type once the file is fetched.
    const extension = fileName.slice(dot).toLowerCase();

    return {
      url,
      path: `${framerConfig.mirrorPrefix}${url.hostname}${url.pathname}`,
      file: `${framerConfig.mirrorPrefix.slice(1)}${url.hostname}${decodedPath}`,
      kind: framerConfig.textExtensions.includes(extension)
        ? MirroredFileKind.Text
        : framerConfig.binaryDataExtensions.includes(extension)
          ? MirroredFileKind.BinaryData
          : MirroredFileKind.Media,
      isModule: framerConfig.moduleExtensions.includes(extension),
    };
  }

  // "https://framerusercontent.com/x" -> "/assets/framerusercontent.com/x".
  // Never changes the length of the text.
  public rewriteUrls(text: string): string {
    let result = text;
    for (const prefix of framerConfig.mirroredPrefixes) {
      // "framerusercontent.com/" or "framer.com/m/".
      const rest = prefix.slice(framerConfig.absolutePrefix.length);
      const escapedRest = rest.replaceAll("/", "\\/");
      result = result
        .replaceAll(prefix, `${framerConfig.mirrorPrefix}${rest}`)
        .replaceAll(
          `${framerConfig.escapedAbsolutePrefix}${escapedRest}`,
          `${framerConfig.escapedMirrorPrefix}${escapedRest}`,
        );
    }
    return result;
  }

  // The paths mirrored files are served under, e.g. "/assets/framer.com/m/".
  public servedPrefixes(): string[] {
    return framerConfig.mirroredPrefixes.map(
      (prefix) =>
        `${framerConfig.mirrorPrefix}${prefix.slice(framerConfig.absolutePrefix.length)}`,
    );
  }

  public rewritePage(html: string, options: IPageRewriteOptions): string {
    const withoutBadge = options.removeBadge ? this.removeBadgeMarkup(html) : html;
    const withoutHints = withoutBadge.replace(/<link\b[^>]*>/gi, (tag) =>
      this.isMirroredHostHint(tag) ? "" : tag,
    );
    const withoutAnalytics = framerConfig.removedScriptHosts.reduce(
      (result, host) => result.replace(this.externalScriptPattern(host), ""),
      withoutHints,
    );
    const withMirroredUrls = this.rewriteModule(withoutAnalytics, options.editorSpecifiers);
    return this.injectIntoHead(
      this.rewriteImageTags(withMirroredUrls, options.resolveImage),
      runtimeFiles.headTags(this.servedPrefixes(), options.imageManifest),
    );
  }

  public rewriteModule(code: string, editorSpecifiers: Set<string>): string {
    let result = code;
    for (const specifier of editorSpecifiers) {
      result = result.replaceAll(specifier, runtimeFiles.editorStubPath());
    }
    return this.rewriteUrls(result);
  }

  // Points <img>, <source> and image preloads at the captured sizes. Only
  // these tags: social previews (og:image) and icons keep the original
  // file, in its original format, which every crawler and browser reads.
  // The page's serialized data is left alone; the runtime shim maps the
  // URLs it builds from it.
  private rewriteImageTags(html: string, resolveImage: (servedUrl: string) => string | null) {
    return html.replace(IMAGE_TAG, (tag) =>
      tag.replace(SERVED_IMAGE_URL, (url) => resolveImage(url) ?? url),
    );
  }

  // Framer renders the badge into its own React root:
  //   <div id="__framer-badge-container"><!--$-->...<a class="__framer-badge">
  // Only the <a> goes. The <!--$--> Suspense markers around it stay, so the
  // stub (which renders nothing) hydrates against matching markup.
  private removeBadgeMarkup(html: string): string {
    return html.replace(
      /(<div\b[^>]*\bid=["']__framer-badge-container["'][^>]*>(?:\s*<!--\$-->)*)\s*<a\b[^>]*\b__framer-badge\b[^>]*>[\s\S]*?<\/a>/i,
      "$1",
    );
  }

  // Ahead of every other script, so the runtime shim is in place before
  // Framer's code runs.
  private injectIntoHead(html: string, tags: string): string {
    const head = /<head\b[^>]*>/i.exec(html);
    if (!head) return tags + html;
    const end = head.index + head[0].length;
    return html.slice(0, end) + tags + html.slice(end);
  }

  // preconnect/dns-prefetch to a host the site no longer loads from.
  private isMirroredHostHint(tag: string): boolean {
    if (!/\brel=["']?(?:preconnect|dns-prefetch)\b/i.test(tag)) return false;
    const href = tag.match(/\bhref=["']?([^"'\s>]+)/i)?.[1];
    if (!href || !URL.canParse(href)) return false;
    const origin = new URL(href).origin;
    return framerConfig.mirroredPrefixes.some((prefix) => new URL(prefix).origin === origin);
  }

  private externalScriptPattern(host: string): RegExp {
    const escapedHost = host.replace(/\./g, "\\.");
    return new RegExp(
      `<script\\b[^>]*\\bsrc=["']?https?://${escapedHost}[^>]*>\\s*</script>`,
      "gi",
    );
  }

  // The decoded path, or null if it could escape its directory once stored
  // on disk (an encoded "..", a backslash or a NUL).
  private decodePath(pathname: string): string | null {
    let decoded: string;
    try {
      decoded = decodeURIComponent(pathname);
    } catch {
      return null;
    }
    const segments = decoded.split("/").slice(1);
    const isUnsafe = segments.some(
      (segment) =>
        segment === "" ||
        segment === "." ||
        segment === ".." ||
        /[\\\0]/.test(segment),
    );
    return isUnsafe ? null : decoded;
  }
}

export const mirrorRewriter = new MirrorRewriter();
