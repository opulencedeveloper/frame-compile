import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import config from "../config";
import framerConfig from "../framer-to-nextjs/config";
import { ICapturedPage, ISiteManifest } from "../framer-to-nextjs/interface";
import { ByteCache } from "../utils/byte-cache";
import { github } from "../utils/github";
import Conversion from "./entity";
import { ConversionStatus } from "./enum";
import { IConversionRepository, IPreviewFile, IPreviewSite } from "./interface";

// Serves a ready conversion from its GitHub repository: the pages as Framer
// published them (the preview branch), which the project's components were
// proven to render identically, and its files from the project's public/.
//
// Everything is read at the commits stored with the conversion, so a file
// never changes once cached.
class PreviewService {
  private readonly files = new ByteCache(
    config.preview.cacheMaxBytes,
    config.preview.cacheMaxFileBytes,
  );
  private readonly sites = new Map<string, Promise<IPreviewSite | null>>();

  // The file for a request path (already split and decoded), or null when
  // the conversion isn't ready or doesn't exist.
  public async getFile(publicId: string, segments: string[]): Promise<IPreviewFile | null> {
    const site = await this.getSite(publicId);
    if (!site) return null;

    const requestPath = `/${segments.join("/")}`;
    if (requestPath.startsWith(framerConfig.mirrorPrefix)) {
      return this.getAsset(site, requestPath);
    }
    if (requestPath === `/${framerConfig.preview.thumbnailFile}`) {
      return this.getThumbnail(site);
    }

    const page = site.manifest.pages.find((candidate) => this.decode(candidate.route) === requestPath);
    return this.getPage(site, page);
  }

  // Fills the cache from a conversion's files while they are still on disk,
  // so its first preview doesn't wait on GitHub. Called once both branches
  // are pushed, before the conversion is marked ready.
  public async prime(
    publicId: string,
    repository: IConversionRepository,
    projectDir: string,
    previewDir: string,
  ) {
    const publicDir = path.join(projectDir, framerConfig.project.publicDir);
    for (const file of await this.filesUnder(publicDir)) {
      const repositoryPath = `${framerConfig.project.publicDir}${path.relative(publicDir, file).split(path.sep).join("/")}`;
      this.files.set(this.key(repository, repository.commitSha, repositoryPath), await readFile(file));
    }
    // Pages last: when the cache is full, the oldest entries go first.
    for (const file of await this.filesUnder(previewDir)) {
      const repositoryPath = path.relative(previewDir, file).split(path.sep).join("/");
      this.files.set(this.key(repository, repository.previewCommitSha, repositoryPath), await readFile(file));
    }

    const manifest = await readFile(path.join(previewDir, framerConfig.preview.manifestFile), "utf8");
    this.sites.set(publicId, Promise.resolve({ repository, manifest: JSON.parse(manifest) as ISiteManifest }));
    this.evictOldestSites();
  }

  private async getAsset(site: IPreviewSite, requestPath: string): Promise<IPreviewFile | null> {
    const body = await this.read(
      site.repository,
      site.repository.commitSha,
      `${framerConfig.project.publicDir}${requestPath.slice(1)}`,
    );
    if (!body) return this.getPage(site, undefined);

    return {
      status: 200,
      contentType: this.contentTypeFor(site.manifest, requestPath),
      body,
      isImmutable: true,
    };
  }

  // The home page's screenshot, the dashboard's thumbnail. Never changes.
  private async getThumbnail(site: IPreviewSite): Promise<IPreviewFile | null> {
    const body = await this.read(
      site.repository,
      site.repository.previewCommitSha,
      framerConfig.preview.thumbnailFile,
    );
    if (!body) return this.getPage(site, undefined);
    return { status: 200, contentType: config.preview.mimeTypes[".jpg"], body, isImmutable: true };
  }

  // Unknown paths get the site's own 404 page, as on Framer.
  private async getPage(
    site: IPreviewSite,
    page: ICapturedPage | undefined,
  ): Promise<IPreviewFile | null> {
    const served = page ?? site.manifest.pages.find((candidate) => candidate.status === 404);
    if (!served) return null;

    const body = await this.read(
      site.repository,
      site.repository.previewCommitSha,
      `${framerConfig.preview.pagesDir}${served.file}`,
    );
    if (!body) return null;

    return {
      status: page ? page.status : 404,
      contentType: config.preview.mimeTypes[".html"],
      body,
      isImmutable: false,
    };
  }

  private getSite(publicId: string): Promise<IPreviewSite | null> {
    let site = this.sites.get(publicId);
    if (!site) {
      site = this.loadSite(publicId);
      this.sites.set(publicId, site);
      this.evictOldestSites();
      // Not ready yet (or gone): asked again next time, not remembered.
      site.then(
        (loaded) => !loaded && this.sites.delete(publicId),
        () => this.sites.delete(publicId),
      );
    }
    return site;
  }

  private async loadSite(publicId: string): Promise<IPreviewSite | null> {
    const conversion = await Conversion.findOne({ publicId, status: ConversionStatus.Ready });
    const repository = conversion?.repository;
    // Conversions stored before the preview branch existed have none.
    if (!repository?.previewCommitSha) return null;

    const manifest = await this.read(
      repository,
      repository.previewCommitSha,
      framerConfig.preview.manifestFile,
    );
    if (!manifest) return null;

    return {
      repository,
      manifest: JSON.parse(manifest.toString("utf8")) as ISiteManifest,
    };
  }

  private async read(
    repository: IConversionRepository,
    commitSha: string,
    filePath: string,
  ): Promise<Buffer | null> {
    const key = this.key(repository, commitSha, filePath);
    const cached = this.files.get(key);
    if (cached) return cached;

    const body = await github.getFile(repository, commitSha, filePath);
    if (body) this.files.set(key, body);
    return body;
  }

  private key(repository: IConversionRepository, commitSha: string, filePath: string): string {
    return `${repository.owner}/${repository.name}@${commitSha}:${filePath}`;
  }

  private async filesUnder(directory: string): Promise<string[]> {
    const entries = await readdir(directory, { recursive: true, withFileTypes: true });
    return entries.filter((entry) => entry.isFile()).map((entry) => path.join(entry.parentPath, entry.name));
  }

  // The manifest's explicit type (for names like "Icon.js@0.0.28"), else
  // the extension's.
  private contentTypeFor(manifest: ISiteManifest, requestPath: string): string {
    for (const [servedPath, contentType] of Object.entries(manifest.contentTypes)) {
      if (this.decode(servedPath) === requestPath) return contentType;
    }
    const fileName = requestPath.slice(requestPath.lastIndexOf("/") + 1);
    const dot = fileName.lastIndexOf(".");
    const extension = dot > 0 ? fileName.slice(dot).toLowerCase() : "";
    return config.preview.mimeTypes[extension] ?? config.preview.defaultMimeType;
  }

  private evictOldestSites() {
    for (const oldest of this.sites.keys()) {
      if (this.sites.size <= config.preview.maxCachedSites) break;
      this.sites.delete(oldest);
    }
  }

  // Routes and served paths are stored URL-encoded; requests arrive decoded.
  private decode(value: string): string {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
}

export const previewService = new PreviewService();
