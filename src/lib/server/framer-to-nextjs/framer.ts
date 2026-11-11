import framerConfig from "./config";

// What we know about how Framer publishes a site.
class FramerSite {
  // Framer's generator tag, or the root its runtime hydrates.
  public isFramerPage(html: string): boolean {
    return (
      /<meta\s[^>]*name=["']generator["'][^>]*content=["']Framer\b/i.test(html) ||
      /<div\s[^>]*id=["']main["'][^>]*data-framer-hydrate-v2/i.test(html)
    );
  }

  // A JSON file keyed by every page's path, used by Framer's site search.
  public searchIndexUrl(html: string, pageUrl: URL): URL | null {
    const match = html.match(
      /<meta\s[^>]*name=["']framer-search-index["'][^>]*content=["']([^"']+)["']/i,
    );
    if (!match || !URL.canParse(match[1], pageUrl)) return null;
    return new URL(match[1], pageUrl);
  }

  // The page's social preview image (og:image, else twitter:image) when it
  // is one of the site's mirrored files: its path, e.g.
  // "/assets/framerusercontent.com/images/x.png".
  public socialImagePath(html: string): string | null {
    for (const name of ["og:image", "twitter:image"]) {
      const tag = html.match(new RegExp(`<meta\\s[^>]*(?:property|name)=["']${name}["'][^>]*>`, "i"))?.[0];
      const content = tag?.match(/\bcontent=["']([^"']+)["']/i)?.[1];
      if (content?.startsWith(framerConfig.mirrorPrefix)) return content;
    }
    return null;
  }

  // One viewport width inside each of the page's breakpoint ranges.
  // Framer hides other breakpoints' markup with rules such as
  //   @media(min-width: 810px) and (max-width: 1199.98px){.hidden-1y5j11w{...
  // whose bounds mark where the ranges start.
  public breakpointWidths(html: string): number[] {
    const settings = framerConfig.browserPass;
    const starts = new Set<number>();
    for (const [, condition] of html.matchAll(/@media\s*([^{]*)\{\s*\.hidden-[\w-]+/g)) {
      for (const [, bound, value] of condition.matchAll(/\((min|max)-width:\s*([\d.]+)px\)/g)) {
        const start = bound === "min" ? Number(value) : Math.ceil(Number(value));
        if (start > 0) starts.add(start);
      }
    }
    if (starts.size === 0) return settings.fallbackWidths;

    const bounds = [...starts].sort((a, b) => a - b);
    const widths = [Math.min(settings.phoneWidth, bounds[0] - 1)];
    bounds.forEach((start, index) => {
      const next = bounds[index + 1];
      widths.push(next === undefined ? Math.max(settings.desktopWidth, start) : start);
    });
    return widths;
  }

  // The editor bar Framer loads for signed-in owners. It talks to Framer's
  // servers, so on a converted site it is replaced with a stub.
  public isEditorModule(url: URL): boolean {
    return framerConfig.editorModulePrefixes.some((prefix) =>
      url.href.startsWith(prefix),
    );
  }

  // Framer's entry module renders the "Made in Framer" badge into
  // #__framer-badge-container from a lazily imported module. Finding that
  // module lets it be replaced with an empty one; removing the container
  // instead makes the runtime throw when it tries to render into it.
  public badgeModuleUrl(code: string, moduleUrl: URL): URL | null {
    const anchor = code.indexOf("__framer-badge-container");
    if (anchor === -1) return null;

    const nearby = code.slice(
      anchor,
      anchor + framerConfig.badgeImportWindow,
    );
    const specifier = nearby.match(/\bimport\(\s*["'`]([^"'`$]+)["'`]\s*\)/)?.[1];
    if (!specifier || !URL.canParse(specifier, moduleUrl)) return null;
    return new URL(specifier, moduleUrl);
  }
}

export const framerSite = new FramerSite();
