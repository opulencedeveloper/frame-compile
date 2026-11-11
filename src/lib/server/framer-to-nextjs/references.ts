import { Parser } from "htmlparser2";
import framerConfig from "./config";
import { IRobotsRule, ISitemapEntries } from "./interface";

// An absolute URL under a mirrored prefix, up to where its path ends. Query
// strings are dropped: Framer's CDN resizes images by query, but the file
// is the same, and a static host ignores the query anyway.
const MIRRORED_URL = new RegExp(
  `(${framerConfig.mirroredPrefixes.map((prefix) => prefix.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).join("|")})([^\\s"'\`<>(){}$\\\\,?#]*)`,
  "g",
);

// A CDN image URL with its query ("...x.png?scale-down-to=512&width=..."),
// once HTML and JSON escaping has been undone.
const IMAGE_REQUEST = new RegExp(
  `${framerConfig.imageVariants.urlPrefix.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}[^\\s"'\`<>(){}$\\\\,?#]+\\?[A-Za-z0-9=&%._~-]+`,
  "g",
);

// Import specifiers: `from "x"`, `import "x"`, and `import("x")` /
// import(`x`) without substitutions. Framer's bundler emits all three.
const STATIC_IMPORT = /\b(?:from|import)\s*["']([^"']+)["']/g;
const DYNAMIC_IMPORT = /\bimport\(\s*(["'`])([^"'`$]+)\1\s*\)/g;

// new URL("rel", "https://base") or new URL("rel", import.meta.url),
// optionally followed by .href.replace("a", "b"). Framer's CMS locates its
// data files this way, swapping "/modules/" for "/cms/".
const URL_CONSTRUCTOR =
  /new URL\(\s*(["'`])([^"'`$]+)\1\s*,\s*(?:(["'`])([^"'`$]+)\3|import\.meta\.url)\s*\)(?:\.href\.replace\(\s*(["'`])([^"'`$]*)\5\s*,\s*(["'`])([^"'`$]*)\7\s*\))?/g;

class ReferenceScanner {
  // Same-origin page links, including alternate-language versions.
  public pageLinks(html: string, pageUrl: URL): URL[] {
    const links: URL[] = [];
    const parser = new Parser({
      onopentag: (name, attributes) => {
        const isLink = name === "a" || (name === "link" && attributes.rel === "alternate");
        const href = attributes.href;
        if (!isLink || !href || !URL.canParse(href, pageUrl)) return;

        const url = new URL(href, pageUrl);
        if (url.origin === pageUrl.origin) links.push(url);
      },
    });
    parser.end(html);
    return links;
  }

  public sitemapEntries(xml: string, sitemapUrl: URL): ISitemapEntries {
    const pages: URL[] = [];
    const sitemaps: URL[] = [];
    let isIndex = false;
    let inLoc = false;
    let loc = "";

    const add = (list: URL[], value: string) => {
      const trimmed = value.trim();
      if (URL.canParse(trimmed, sitemapUrl)) list.push(new URL(trimmed, sitemapUrl));
    };

    const parser = new Parser(
      {
        onopentag: (name, attributes) => {
          if (name === "sitemapindex") isIndex = true;
          if (name === "loc") {
            inLoc = true;
            loc = "";
          }
          // <xhtml:link rel="alternate" hreflang="fr" href="...">
          if (name === "xhtml:link" && attributes.href) add(pages, attributes.href);
        },
        ontext: (text) => {
          if (inLoc) loc += text;
        },
        onclosetag: (name) => {
          if (name !== "loc") return;
          inLoc = false;
          add(isIndex ? sitemaps : pages, loc);
        },
      },
      { xmlMode: true },
    );
    parser.end(xml);
    return { pages, sitemaps };
  }

  // The rule groups of a robots.txt. A group is one or more User-agent
  // lines followed by their rules; Sitemap lines and comments are dropped
  // (the converted site advertises its own sitemap). An empty Disallow
  // means nothing is disallowed.
  public robotsRules(text: string): IRobotsRule[] {
    const rules: IRobotsRule[] = [];
    let current: IRobotsRule | null = null;
    let isReadingAgents = false;

    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.replace(/#.*$/, "").trim();
      const colon = line.indexOf(":");
      if (colon === -1) continue;
      const field = line.slice(0, colon).trim().toLowerCase();
      const value = line.slice(colon + 1).trim();

      if (field === "user-agent") {
        if (!current || !isReadingAgents) {
          current = { userAgent: [], allow: [], disallow: [] };
          rules.push(current);
        }
        if (value) current.userAgent.push(value);
        isReadingAgents = true;
        continue;
      }
      isReadingAgents = false;
      if (!current || !value) continue;
      if (field === "allow") current.allow.push(value);
      if (field === "disallow") current.disallow.push(value);
    }

    return rules
      .filter((rule) => rule.userAgent.length > 0)
      .map((rule) =>
        rule.allow.length || rule.disallow.length ? rule : { ...rule, allow: ["/"] },
      );
  }

  // Framer's search index is keyed by each page's path. It only adds pages
  // the sitemap and links may have missed, so an unreadable one is skipped.
  public searchIndexRoutes(json: string): string[] {
    let index: unknown;
    try {
      index = JSON.parse(json);
    } catch {
      return [];
    }
    if (!index || typeof index !== "object") return [];
    return Object.keys(index).filter((key) => key.startsWith("/"));
  }

  // Every mirrored-host URL in a file, wherever it appears: HTML attributes,
  // inline CSS, JavaScript strings, JSON or Framer's binary CMS data.
  public mirroredUrls(text: string): URL[] {
    // JSON-escaped slashes ("https:\/\/host\/x") are the same URL.
    const unescaped = text.replaceAll("\\/", "/");
    return Array.from(
      unescaped.matchAll(MIRRORED_URL),
      ([, prefix, path]) => new URL(`${prefix}${path}`),
    );
  }

  // CDN image URLs that ask for a particular size, wherever they appear.
  public imageRequests(text: string): URL[] {
    const unescaped = text
      .replaceAll("\\/", "/")
      .replaceAll("\\u0026", "&")
      .replaceAll("&amp;", "&");
    return Array.from(unescaped.matchAll(IMAGE_REQUEST), ([url]) => new URL(url));
  }

  // URLs a JavaScript module loads: its imports and the data files it
  // locates with `new URL()`.
  public moduleReferences(code: string, moduleUrl: URL): URL[] {
    const references: URL[] = [];

    const resolve = (specifier: string, base: URL | string = moduleUrl) => {
      // Bare specifiers ("react") are resolved by an import map, not by URL.
      if (!/^(?:\.{0,2}\/|https?:\/\/)/.test(specifier)) return;
      if (URL.canParse(specifier, base)) references.push(new URL(specifier, base));
    };

    for (const [, specifier] of code.matchAll(STATIC_IMPORT)) resolve(specifier);
    for (const [, , specifier] of code.matchAll(DYNAMIC_IMPORT)) resolve(specifier);

    for (const match of code.matchAll(URL_CONSTRUCTOR)) {
      const [, , relative, , base, , search, , replacement] = match;
      if (base !== undefined && !URL.canParse(base, moduleUrl)) continue;

      const baseUrl = base === undefined ? moduleUrl : new URL(base, moduleUrl);
      if (!URL.canParse(relative, baseUrl)) continue;

      let href = new URL(relative, baseUrl).href;
      if (search !== undefined) href = href.replace(search, replacement ?? "");
      resolve(href);
    }

    return references;
  }
}

export const referenceScanner = new ReferenceScanner();
