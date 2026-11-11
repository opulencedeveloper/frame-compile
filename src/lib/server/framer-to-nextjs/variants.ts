import framerConfig from "./config";
import { IImageVariant, IImageVariantIndex, IImageVariantManifest } from "./interface";
import { mirrorRewriter } from "./mirror";

const settings = framerConfig.imageVariants;

// Sizes of Framer CDN images, captured as files of their own.
//
// The CDN answers "x.png?scale-down-to=512&width=1035&height=620" with x.png
// scaled down to 512px and re-encoded; width and height only describe the
// original. A static host would send the full-size original for every such
// URL, so each size a page uses is downloaded once and pages point at it.
class ImageVariants {
  // The variant a CDN image URL asks for, or null when the original file is
  // the right answer: no query, a format the CDN doesn't re-encode, or a
  // parameter we don't reproduce.
  public fromUrl(url: URL): IImageVariant | null {
    if (!url.href.startsWith(settings.urlPrefix) || !url.search) return null;

    const size = this.requestedSize(url.searchParams);
    if (size === null) return null;

    const source = new URL(url.pathname, url.origin);
    const target = mirrorRewriter.target(source);
    if (!target || !this.hasVariantExtension(target.path)) return null;

    const fetchUrl = new URL(source);
    if (size > 0) fetchUrl.searchParams.set(settings.sizeParam, String(size));

    return {
      sourcePath: target.path,
      size,
      path: this.variantPath(target.path, size),
      file: this.variantPath(target.file, size),
      fetchUrl,
    };
  }

  // The captured variant for a served image URL with its query, e.g.
  // "/assets/framerusercontent.com/images/x.png?scale-down-to=512", or null.
  public resolve(servedUrl: string, captured: IImageVariantIndex): string | null {
    const queryStart = servedUrl.indexOf("?");
    if (queryStart === -1) return null;

    const path = servedUrl.slice(0, queryStart);
    const query = servedUrl.slice(queryStart + 1).replaceAll("&amp;", "&");
    const size = this.requestedSize(new URLSearchParams(query));
    if (size === null) return null;

    return captured.get(this.key(path, size)) ?? null;
  }

  public key(sourcePath: string, size: number): string {
    return `${sourcePath}|${size}`;
  }

  public directory(): string {
    const host = settings.urlPrefix.slice(framerConfig.absolutePrefix.length);
    return `${framerConfig.mirrorPrefix}${host}`;
  }

  // Every captured size per image, for the runtime shim.
  public manifest(variants: Iterable<IImageVariant>): IImageVariantManifest {
    const directory = this.directory();
    const sizes: Record<string, number[]> = {};
    for (const variant of variants) {
      if (!variant.sourcePath.startsWith(directory)) continue;
      const name = variant.sourcePath.slice(directory.length);
      (sizes[name] ??= []).push(variant.size);
    }
    // Ascending, with full size (0) last: the shim takes the first size
    // that is large enough.
    for (const list of Object.values(sizes)) {
      list.sort((a, b) => (a === 0 ? 1 : b === 0 ? -1 : a - b));
    }
    return { directory, sizes };
  }

  // 0 for full size, a pixel size, or null if the query asks for something
  // other than a resize.
  private requestedSize(params: URLSearchParams): number | null {
    let size = 0;
    for (const [name, value] of params) {
      if (name === settings.sizeParam) {
        if (!/^[1-9]\d{0,4}$/.test(value)) return null;
        size = Number(value);
      } else if (!settings.descriptiveParams.includes(name)) {
        return null;
      }
    }
    return size;
  }

  // "/a/x.png" -> "/a/x-512w.webp" or "/a/x-full.webp".
  private variantPath(sourcePath: string, size: number): string {
    const stem = sourcePath.slice(0, sourcePath.lastIndexOf("."));
    const suffix = size > 0 ? `${size}${settings.sizeSuffix}` : settings.fullSizeSuffix;
    return `${stem}-${suffix}${settings.fileExtension}`;
  }

  private hasVariantExtension(path: string): boolean {
    const extension = path.slice(path.lastIndexOf(".")).toLowerCase();
    return settings.extensions.includes(extension);
  }
}

export const imageVariants = new ImageVariants();
