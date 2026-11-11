import { Element } from "domhandler";
import { CaptureIssueType, JsxComponentKind, JsxNodeKind, MirroredFileKind } from "./enum";

// Where a capture writes its output. The paths are relative to the root of
// the static site, e.g. "index.html" or "assets/framerusercontent.com/x.png".
export interface ISnapshotSink {
  write(path: string, body: Uint8Array): Promise<void>;
}

export interface ICaptureIssue {
  type: CaptureIssueType;
  url?: string;
  detail?: string;
}

export interface ICapturedPage {
  route: string;
  file: string;
  status: number;
}

// site.json on the preview branch: the pages as published, by route.
export interface ISiteManifest {
  // The Framer site it was converted from, e.g. "https://x.framer.website".
  sourceOrigin: string;
  // Paths relative to the pages directory.
  pages: ICapturedPage[];
  // Served paths that need an explicit Content-Type.
  contentTypes: Record<string, string>;
}

// What writing a project reports back.
export interface IProjectResult {
  // What couldn't be converted to JSX.
  issues: ICaptureIssue[];
  // The home page's social preview image, for thumbnails.
  thumbnailPath: string | null;
}

// site/site.json in a generated project: what the route handler serves.
export interface IProjectManifest {
  sourceOrigin: string;
  pages: IProjectPage[];
  // The original robots.txt rules, kept so a site that blocked crawlers on
  // Framer still does.
  robots: IRobotsRule[];
  contentTypes: Record<string, string>;
}

export interface IProjectPage {
  route: string;
  status: number;
  // The page's shell, relative to the shells directory.
  shell: string;
  // The view rendered into it, by its key in src/views/index.ts; null for
  // a page served as published (no Framer content root).
  view: string | null;
}

// ----- JSX -----

export interface IJsxStyleValue {
  // React style property names (camelCase, or "--custom"), and values.
  style: [string, string][];
}

export interface IJsxHtmlValue {
  // For dangerouslySetInnerHTML: the text of <style> elements.
  html: string;
}

export type JsxPropValue = string | true | IJsxStyleValue | IJsxHtmlValue;

export interface IJsxProp {
  // The React prop name.
  name: string;
  value: JsxPropValue;
}

export interface IJsxElement {
  kind: JsxNodeKind.Element;
  tag: string;
  props: IJsxProp[];
  children: IJsxNode[];
  // The element it was converted from.
  source: Element;
}

export interface IJsxText {
  kind: JsxNodeKind.Text;
  text: string;
}

export interface IJsxSuspense {
  kind: JsxNodeKind.Suspense;
  children: IJsxNode[];
}

export interface IJsxRaw {
  kind: JsxNodeKind.Raw;
  html: string;
}

export interface IJsxComponentRef {
  kind: JsxNodeKind.Component;
  component: IJsxComponent;
}

export type IJsxNode = IJsxElement | IJsxText | IJsxSuspense | IJsxRaw | IJsxComponentRef;

export interface IJsxComponent {
  kind: JsxComponentKind;
  name: string;
  root: IJsxNode;
}

// A page's HTML, split into its content and the rest.
export interface IPageParts {
  // The page with its content replaced by the main marker.
  shell: string;
  // Framer's content root, #main.
  main: Element;
  // The page's HTML, which every element's indices point into.
  html: string;
}

// A page's content as JSX that renders to exactly the same DOM.
export interface IVerifiedJsx {
  root: IJsxNode;
  // Elements kept as raw HTML because React rendered them differently.
  rawCount: number;
}

// A component's source, ready to be written.
export interface IJsxFile {
  path: string;
  source: string;
}

// A page's view, and the folder name for its own sections.
export interface IPageView {
  component: IJsxComponent;
  slug: string;
}

// How a component file imports one of its child components.
export interface IComponentImport {
  identifier: string;
  path: string;
}

// What a component's code refers to while it is written.
export interface IJsxEmitState {
  identifierOf: (component: IJsxComponent) => string;
  usesSuspense: boolean;
  usesRaw: boolean;
  rawConstants: string[];
  children: Set<IJsxComponent>;
}

// A fetched page, written once the whole site has been captured.
export interface IHeldPage extends ICapturedPage {
  body: Buffer;
}

// One group of a robots.txt: the crawlers it names and their rules.
export interface IRobotsRule {
  userAgent: string[];
  allow: string[];
  disallow: string[];
}

export interface ICaptureResult {
  siteUrl: string;
  pages: ICapturedPage[];
  fileCount: number;
  totalBytes: number;
  issues: ICaptureIssue[];
  // The home page at desktop size (JPEG), when the browser pass ran.
  thumbnail: Buffer | null;
  // The site's robots.txt rules; null when it has none.
  robots: IRobotsRule[] | null;
  // Served paths whose extension doesn't imply their type, mapped to the
  // Content-Type hosting must send (e.g. JavaScript modules named
  // "Icon.js@0.0.28").
  contentTypes: Record<string, string>;
}

// A file on a mirrored host, before it is written.
export interface IMirrorTarget {
  url: URL;
  // The URL path it is served from on the converted site.
  path: string;
  // The same path relative to the site root, decoded, as stored on disk.
  file: string;
  kind: MirroredFileKind;
  isModule: boolean;
}

export interface IFetchedMirrorFile extends IMirrorTarget {
  body: Buffer;
}

export interface ISitemapEntries {
  pages: URL[];
  // Nested sitemaps listed by a sitemap index.
  sitemaps: URL[];
}

export interface IPageRewriteOptions {
  // The badge module was replaced with one that renders nothing, so its
  // server-rendered markup must go too, or hydrating it fails.
  removeBadge: boolean;
  // Pages preload the editor bar for signed-in owners; it points at the stub.
  editorSpecifiers: Set<string>;
  // The captured variant for a served image URL with a query, or null.
  // Applied to <img>, <source> and image preload tags.
  resolveImage: (servedUrl: string) => string | null;
  // Captured image sizes, for URLs the page builds while it runs.
  imageManifest: IImageVariantManifest;
}

// One size of an image, as Framer's CDN serves it for a query.
export interface IImageVariant {
  // The original image's path on the converted site.
  sourcePath: string;
  // The longest side in pixels it is scaled down to; 0 for full size.
  size: number;
  // Where the variant is served from, and stored relative to the site root.
  path: string;
  file: string;
  // The CDN URL that produces it.
  fetchUrl: URL;
}

// Captured variant paths by "<sourcePath>|<size>".
export type IImageVariantIndex = Map<string, string>;

// What the runtime shim needs to map image URLs the page builds while it
// runs onto the captured variants.
export interface IImageVariantManifest {
  // The served directory of every image, e.g. "/assets/framerusercontent.com/images/".
  directory: string;
  // Captured sizes by image file name, ascending, 0 (full size) last.
  sizes: Record<string, number[]>;
}

export interface IBrowserPassFailure {
  url: string;
  reason: string;
}

export interface IBrowserPassResult {
  // Mirrored-host URLs the pages requested or referenced while running.
  urls: URL[];
  // Pages that didn't load or couldn't be inspected.
  failedPages: IBrowserPassFailure[];
  // The home page at desktop size, as a JPEG.
  screenshot: Buffer | null;
  // Set when the browser couldn't be started at all.
  unavailableReason?: string;
}

// Runtime modules that only work on Framer's hosting, found while scanning.
export interface IRuntimeStubs {
  // Absolute specifiers of editor-bar modules, as written in the code.
  editorSpecifiers: Set<string>;
  // URLs of modules that render the "Made in Framer" badge.
  badgeModules: Set<string>;
}
