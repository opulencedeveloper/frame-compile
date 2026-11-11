import framerConfig from "./config";
import { CaptureIssueType } from "./enum";
import {
  ICaptureIssue,
  ICapturedPage,
  ICaptureResult,
  IPageView,
  IProjectManifest,
  IProjectResult,
  IProjectPage,
  ISiteManifest,
  ISnapshotSink,
} from "./interface";
import { framerSite } from "./framer";
import { jsxFiles } from "./jsx-files";
import { jsxRenderer } from "./jsx-renderer";
import { jsxSections } from "./jsx-sections";
import { pageDocument } from "./page-document";

const settings = framerConfig.project;
const jsx = framerConfig.jsx;
// "assets/", where every mirrored file and our runtime files are stored.
const ASSETS_DIR = framerConfig.mirrorPrefix.slice(1);

// ----- Templates of the generated project -----

// Renders a view into its page's shell. The same steps as JsxRenderer.render,
// which proved at conversion that this output is Framer's page.
const RENDER = `import { createElement, type ComponentType } from "react";

// Where the page's content goes in its shell (site/shells).
const MAIN_MARKER = ${JSON.stringify(jsx.mainMarker)};
// React writes this between adjacent pieces of text; Framer's pages have none.
const TEXT_SEPARATOR = ${JSON.stringify(jsx.textSeparator)};
// RawHtml's wrapper, removed so only its HTML remains.
const RAW_OPEN = ${JSON.stringify(`<template ${jsx.rawAttribute}="">${jsx.rawMarkerOpen}`)};
const RAW_CLOSE = ${JSON.stringify(`${jsx.rawMarkerClose}</template>`)};

// A page: its shell, with the view rendered where Framer's content was.
// Framer's runtime then hydrates that content in the browser, exactly as on
// Framer, so keep the <Suspense> boundaries: they are its hydration markers.
export async function renderPage(shell: string, View: ComponentType | null): Promise<string> {
  if (!View) return shell;

  // Imported when called: Next.js only allows react-dom/server in route
  // handlers that load it at request time.
  const { renderToString } = await import("react-dom/server");
  // Rendered inside <body>: React puts the preloads it adds for priority
  // images before it, and those are left out.
  const body = renderToString(createElement("body", null, createElement(View)));
  const content = body
    .slice(body.indexOf("<body>") + "<body>".length, body.lastIndexOf("</body>"))
    .replaceAll(TEXT_SEPARATOR, "")
    .replaceAll(RAW_OPEN, "")
    .replaceAll(RAW_CLOSE, "");
  return shell.replace(MAIN_MARKER, () => content);
}
`;

const RAW_HTML = `// HTML kept exactly as Framer published it, where JSX couldn't reproduce it
// identically. src/render.ts unwraps it, so only the HTML reaches the page.
export default function RawHtml({ html }: { html: string }) {
  return (
    <template
      ${jsx.rawAttribute}=""
      dangerouslySetInnerHTML={{ __html: ${JSON.stringify(jsx.rawMarkerOpen)} + html + ${JSON.stringify(jsx.rawMarkerClose)} }}
    />
  );
}
`;

// Framer's markup uses CSS newer than React's types (custom properties,
// corner-shape) and its own attributes (data-*, _constraints). They render
// correctly; these declarations stop TypeScript rejecting them.
const FRAMER_TYPES = `import "react";

declare module "react" {
  interface CSSProperties {
    [property: string]: string | number | undefined;
  }
  interface HTMLAttributes<T> {
    [attribute: string]: unknown;
  }
  interface SVGAttributes<T> {
    [attribute: string]: unknown;
  }
}
`;

const ROUTE_HANDLER = `import { readFile } from "node:fs/promises";
import path from "node:path";
import site from "../../site/site.json";
import { renderPage } from "@/render";
import { configuredSiteUrl } from "@/site-url";
import { views } from "@/views";

// Every page of the site: its view (src/views) rendered into its shell
// (site/shells). In development each request renders again, so edits show
// on refresh; \`next build\` renders every page once, as static HTML.

type Page = (typeof site.pages)[number];

interface PageContext {
  params: Promise<{ path?: string[] }>;
}

const shellsDirectory = path.join(process.cwd(), "site", "shells");
const pagesByRoute = new Map<string, Page>(
  site.pages.map((page) => [decodeRoute(page.route), page]),
);
const notFoundPage = site.pages.find((page) => page.status === 404);

// canonical and og:url name the Framer site; they are pointed here instead.
const siteUrl = configuredSiteUrl();
const SOCIAL_IMAGE =
  /(<meta\\b[^>]*\\b(?:property|name)="(?:og:image|twitter:image)"[^>]*\\bcontent=")\\//g;

// Known pages are rendered at build time. Any other path gets the site's
// 404 page.
export const dynamicParams = true;

export function generateStaticParams() {
  return site.pages
    .filter((page) => page.status === 200)
    .map((page) => ({ path: segmentsOf(decodeRoute(page.route)) }));
}

export async function GET(_request: Request, { params }: PageContext) {
  const { path: segments = [] } = await params;
  const page = pagesByRoute.get("/" + segments.join("/"));
  const served = page ?? notFoundPage;
  if (!served) {
    return new Response("Not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const shell = await readFile(path.join(shellsDirectory, served.shell), "utf8");
  const View = served.view ? views[served.view as keyof typeof views] : null;
  return new Response(localize(await renderPage(shell, View)), {
    status: page ? page.status : 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function localize(html: string): string {
  const withSiteUrl = html.replaceAll(site.sourceOrigin + "/", siteUrl + "/");
  // Link previews need absolute image URLs, so this needs SITE_URL.
  return siteUrl ? withSiteUrl.replace(SOCIAL_IMAGE, "$1" + siteUrl + "/") : withSiteUrl;
}

function decodeRoute(route: string): string {
  try {
    return decodeURIComponent(route);
  } catch {
    return route;
  }
}

function segmentsOf(route: string): string[] {
  return route === "/" ? [] : route.slice(1).split("/");
}
`;

const SITE_URL = `import { headers } from "next/headers";

// The site's own address: SITE_URL, or the production domain on Vercel.
// Empty when neither is set; pages then keep root-relative canonical links,
// valid but a weaker signal to search engines.
export function configuredSiteUrl(): string {
  const vercelDomain = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const configured = process.env.SITE_URL || (vercelDomain ? "https://" + vercelDomain : "");
  if (!configured) return "";
  const withScheme = /^https?:\\/\\//i.test(configured) ? configured : "https://" + configured;
  return URL.canParse(withScheme) ? new URL(withScheme).origin : "";
}

// An absolute address for files that need one (the sitemap, robots.txt):
// the configured one, else the address this request came to.
export async function siteOrigin(): Promise<string> {
  const configured = configuredSiteUrl();
  if (configured) return configured;

  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost";
  const isLocal = /^(localhost|127\\.0\\.0\\.1)(:|$)/.test(host);
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
  return protocol + "://" + host;
}
`;

const SITEMAP = `import type { MetadataRoute } from "next";
import site from "../site/site.json";
import { siteOrigin } from "@/site-url";

// Every page, at the site's own address. Built from site/site.json, so it
// lists exactly the routes this project serves.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = await siteOrigin();
  return site.pages
    .filter((page) => page.status === 200)
    .map((page) => ({ url: origin + page.route }));
}
`;

const ROBOTS = `import type { MetadataRoute } from "next";
import site from "../site/site.json";
import { siteOrigin } from "@/site-url";

// The rules the site had on Framer, so a site that kept crawlers out still
// does, pointing them at this site's sitemap.
export default async function robots(): Promise<MetadataRoute.Robots> {
  const origin = await siteOrigin();
  return {
    rules: site.robots.length > 0 ? site.robots : [{ userAgent: "*", allow: "/" }],
    sitemap: origin + "/sitemap.xml",
  };
}
`;

const NEXT_CONFIG = `import type { NextConfig } from "next";
import site from "./site/site.json";

// Header sources use path-to-regexp syntax; file names are matched literally.
const literalSource = (path: string) => path.replace(/[\\\\:()[\\]{}*+?!]/g, "\\\\$&");
const contentTypes: Record<string, string> = site.contentTypes;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The route handler reads the page shells at request time (the 404 page),
  // so they must be part of the deployment.
  outputFileTracingIncludes: { "/[[...path]]": ["./site/shells/**/*"] },
  async headers() {
    return [
      // Framer's file names change whenever their content does.
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      // Files whose name doesn't say what they are, e.g. "Icon.js@0.0.28".
      // Browsers only run modules served as JavaScript.
      ...Object.entries(contentTypes).map(([path, type]) => ({
        source: literalSource(path),
        headers: [{ key: "Content-Type", value: type }],
      })),
    ];
  },
};

export default nextConfig;
`;

const TSCONFIG = {
  compilerOptions: {
    target: "ES2022",
    lib: ["dom", "dom.iterable", "esnext"],
    allowJs: true,
    skipLibCheck: true,
    strict: true,
    noEmit: true,
    esModuleInterop: true,
    module: "esnext",
    moduleResolution: "bundler",
    resolveJsonModule: true,
    isolatedModules: true,
    jsx: "react-jsx",
    incremental: true,
    plugins: [{ name: "next" }],
    paths: { "@/*": ["./src/*"] },
  },
  include: [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    ".next/dev/types/**/*.ts",
  ],
  exclude: ["node_modules", "public"],
};

const GITIGNORE = `/node_modules
/.next/
/out/
next-env.d.ts
*.tsbuildinfo
.env*
.vercel
.DS_Store
`;

// One project being written. Pages arrive while the site is captured and
// are turned into components once every page is in.
class NextProjectWriter {
  private readonly pages = new Map<string, Buffer>();

  // Where the capture writes: mirrored files go straight to public/; pages
  // ("index.html", "project/x.html") are kept for write().
  public readonly sink: ISnapshotSink = {
    write: async (path, body) => {
      if (path.startsWith(ASSETS_DIR)) {
        await this.target.write(`${settings.publicDir}${path}`, body);
      } else {
        this.pages.set(path, Buffer.from(body));
      }
    },
  };

  constructor(private readonly target: ISnapshotSink) {}

  // Writes the project to the target, and the pages as published to
  // `preview`.
  public async write(result: ICaptureResult, preview: ISnapshotSink): Promise<IProjectResult> {
    const issues: ICaptureIssue[] = [];
    let thumbnailPath: string | null = null;
    const source = new URL(result.siteUrl);
    const viewNames = new Set<string>();
    const slugs = new Set<string>();
    const views: IPageView[] = [];
    const projectPages: IProjectPage[] = [];

    for (const page of result.pages) {
      const body = this.pages.get(page.file);
      if (!body) continue;
      await preview.write(`${framerConfig.preview.pagesDir}${page.file}`, body);

      const html = body.toString("utf8");
      if (page.route === "/") thumbnailPath = framerSite.socialImagePath(html);
      const parts = pageDocument.split(html);
      let shell = html;
      let view: string | null = null;

      if (parts) {
        const verified = await jsxRenderer.verified(parts);
        if (verified.rawCount > 0) {
          issues.push({
            type: CaptureIssueType.RawHtmlKept,
            url: page.route,
            detail: `${verified.rawCount} element(s) kept as HTML`,
          });
        }
        view = jsxSections.uniqueName(this.viewName(page), viewNames);
        views.push({
          component: jsxSections.split(verified.root, view),
          slug: jsxSections.uniqueName(this.slug(page), slugs),
        });
        shell = parts.shell;
      } else {
        issues.push({ type: CaptureIssueType.PageNotConverted, url: page.route });
      }

      await this.target.write(`${settings.shellsDir}${page.file}`, Buffer.from(shell));
      projectPages.push({ route: page.route, status: page.status, shell: page.file, view });
    }

    const componentFiles = jsxFiles.assemble(views);
    const files: Record<string, string> = Object.fromEntries(
      componentFiles.map((file) => [file.path, file.source]),
    );
    if (jsxFiles.usesRawHtml(componentFiles)) files["src/components/RawHtml.tsx"] = RAW_HTML;

    const manifest: IProjectManifest = {
      sourceOrigin: source.origin,
      pages: projectPages,
      robots: result.robots ?? [],
      contentTypes: result.contentTypes,
    };
    Object.assign(files, {
      [settings.manifestFile]: this.json(manifest),
      "src/views/index.ts": this.viewsIndex(views),
      "src/render.ts": RENDER,
      "src/site-url.ts": SITE_URL,
      "app/sitemap.ts": SITEMAP,
      "app/robots.ts": ROBOTS,
      "src/types/framer.d.ts": FRAMER_TYPES,
      "app/[[...path]]/route.ts": ROUTE_HANDLER,
      "next.config.ts": NEXT_CONFIG,
      "tsconfig.json": this.json(TSCONFIG),
      "package.json": this.json(this.packageJson(source)),
      ".gitignore": GITIGNORE,
      "README.md": this.readme(source, result.pages, componentFiles.length),
    });
    for (const [path, content] of Object.entries(files)) {
      await this.target.write(path, Buffer.from(content));
    }

    const previewManifest: ISiteManifest = {
      sourceOrigin: source.origin,
      pages: result.pages,
      contentTypes: result.contentTypes,
    };
    await preview.write(framerConfig.preview.manifestFile, Buffer.from(this.json(previewManifest)));
    await preview.write(
      framerConfig.preview.readmeFile,
      Buffer.from(this.previewReadme(source, Boolean(result.thumbnail))),
    );

    // A screenshot beats the social image, which is often a generic card.
    if (result.thumbnail) {
      await preview.write(framerConfig.preview.thumbnailFile, result.thumbnail);
      thumbnailPath = `/${framerConfig.preview.thumbnailFile}`;
    }
    return { issues, thumbnailPath };
  }

  // "/" -> "HomePage", "/project/flux" -> "ProjectFluxPage".
  private viewName(page: ICapturedPage): string {
    if (page.status === 404) return "NotFoundPage";
    if (page.route === "/") return "HomePage";
    const name = jsxSections.pascal(this.decode(page.route));
    return name.endsWith("Page") ? name : `${name}Page`;
  }

  // The folder of a page's own sections: "home", "project-flux".
  private slug(page: ICapturedPage): string {
    if (page.status === 404) return "not-found";
    if (page.route === "/") return "home";
    const slug = this.decode(page.route).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return slug || "page";
  }

  private viewsIndex(views: IPageView[]): string {
    const names = views.map(({ component }) => component.name).sort();
    return `${names.map((name) => `import ${name} from "./${name}";`).join("\n")}

// Every page's view, by the name site/site.json gives it.
export const views = {
${names.map((name) => `  ${name},`).join("\n")}
};
`;
  }

  private packageJson(source: URL) {
    return {
      name: this.packageName(source.hostname),
      version: "1.0.0",
      private: true,
      scripts: { dev: "next dev", build: "next build", start: "next start" },
      dependencies: settings.dependencies,
      devDependencies: settings.devDependencies,
      engines: { node: settings.nodeVersion },
    };
  }

  // "samuelologwu.framer.website" -> "samuelologwu-framer-website".
  private packageName(hostname: string): string {
    const name = hostname.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return name.slice(0, 214) || "framer-site";
  }

  // The preview branch's README. Written for developers who open the
  // repository and wonder what the second branch is.
  private previewReadme(source: URL, hasThumbnail: boolean): string {
    const { branch, pagesDir, manifestFile, thumbnailFile } = framerConfig.preview;
    const thumbnailLine = hasThumbnail
      ? `\n${thumbnailFile.padEnd(28)}the screenshot shown on your FrameCompile dashboard`
      : "";
    return `# ${branch}

This branch is used by FrameCompile to show the live preview of this
conversion. **You don't need it to run, edit or deploy your site.** Your
Next.js project is on the \`main\` branch.

## What's here

\`\`\`
${pagesDir.padEnd(28)}each page of ${source.hostname} as Framer published it
${manifestFile.padEnd(28)}the routes, which file each one is, and their status codes${thumbnailLine}
\`\`\`

## Why it exists

The project on \`main\` is React components. Showing it as a website means
installing its dependencies and building it, which takes about a minute.
The preview has to be instant, so it serves these pages instead.

They are the same pages your components render: during the conversion,
FrameCompile rendered every component and compared the result with these
pages, element by element, and they matched. Images, fonts and scripts
aren't repeated here; the preview loads them from \`main\` (\`public/assets\`).

## Can I change or delete it?

- **Editing these files** has no effect on your project, and the preview
  keeps showing the version saved when the conversion ran.
- **Deleting this branch** leaves your project intact, but the preview in
  FrameCompile stops working.
- **When you deploy**, deploy \`main\`. This branch isn't a website on its own.
`;
  }

  private readme(source: URL, pages: ICapturedPage[], componentCount: number): string {
    const pageList = pages.map((page) => `- \`${page.route}\``).join("\n");
    return `# ${source.hostname}

A Next.js project converted from [${source.href}](${source.href}) by FrameCompile:
${pages.length} page(s), ${componentCount} React component(s).

Each page is React components that render exactly the HTML Framer published,
and every file the site loads (scripts, fonts, images, CMS data) is served from
\`public/assets\`. Framer's own runtime then brings the page to life in the
browser, so it looks and behaves as it does on Framer, without depending on
Framer's servers.

## Running it

\`\`\`bash
npm install
npm run dev
\`\`\`

Edit any component and refresh to see the change. \`npm run build\` renders
every page once, as static HTML; \`npm start\` serves the build.

## Layout

\`\`\`
src/views/                one component per page
src/sections/<page>/      the sections only that page has
src/components/           sections shared by several pages (navigation, footer)
src/components/graphics/  large inline SVGs
src/render.ts             renders a view into its page's shell
site/shells/              each page's HTML around its content: <head>, Framer's scripts
site/site.json            the routes, their views and status codes
app/[[...path]]/route.ts  serves the pages (and the 404 page for unknown paths)
app/sitemap.ts            /sitemap.xml: every page, at the site's own address
app/robots.ts             /robots.txt: the site's robots rules from Framer
src/site-url.ts           the site's address (SITE_URL), shared by the above
public/assets/            everything the pages load, mirrored from Framer
\`\`\`

## Editing

Components are ordinary JSX: change text, classes and styles freely. Two things
are load-bearing:

- **\`<Suspense>\` boundaries** are Framer's hydration markers. Its runtime reads
  them to adopt the page instead of re-rendering it, so keep them.
- **The page's structure.** Framer's runtime hydrates this markup with its own
  components, so removing or reordering elements can make it re-render that
  part of the page. Text, classes and styles are safe to change.

The \`<head>\` (title, meta tags) is in each page's shell in \`site/shells\`.

## Before you deploy: set \`SITE_URL\` where the site is built

\`\`\`bash
SITE_URL=https://your-domain.com
\`\`\`

Framer's pages name the Framer site as their canonical URL. They are pointed
at \`SITE_URL\` instead, social preview images are made absolute with it, and
\`/sitemap.xml\` and \`/robots.txt\` list the site at that address.
Pages are rendered when the site is built, so set it in the build
environment. On Vercel the production domain is used when \`SITE_URL\`
isn't set.

## Pages

${pageList}
`;
  }

  private decode(path: string): string {
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  }

  private json(value: unknown): string {
    return `${JSON.stringify(value, null, 2)}\n`;
  }
}

class NextProject {
  public writer(target: ISnapshotSink): NextProjectWriter {
    return new NextProjectWriter(target);
  }
}

export const nextProject = new NextProject();
