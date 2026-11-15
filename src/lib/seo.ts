import type { Metadata } from "next";
import { faqItems, pageSeo, siteSeo } from "@/resources/seo";
import { PageSeo } from "@/types/seo";

// The production address (see siteSeo.url).
export function siteUrl(): URL {
  return new URL(siteSeo.url);
}

export function absoluteUrl(path: string): string {
  return new URL(path, siteUrl()).toString();
}

// The site's share image (app/opengraph-image.tsx). A page that sets its
// own Open Graph metadata replaces its parent's, image included, so it is
// named explicitly; a page with its own opengraph-image file still wins.
export const defaultShareImage = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${siteSeo.name}: ${siteSeo.tagline}`,
};

// A public page's metadata: its title, description and canonical address,
// and the same for link previews.
export function pageMetadata(page: PageSeo, options: { absoluteTitle?: boolean } = {}): Metadata {
  // Link previews show the title on its own, so it carries the name too.
  const shareTitle = options.absoluteTitle ? page.title : `${page.title} | ${siteSeo.name}`;
  return {
    title: options.absoluteTitle ? { absolute: page.title } : page.title,
    description: page.description,
    alternates: { canonical: page.path },
    openGraph: {
      type: "website",
      url: page.path,
      siteName: siteSeo.name,
      locale: siteSeo.locale,
      title: shareTitle,
      description: page.description,
      images: [defaultShareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: shareTitle,
      description: page.description,
      images: [defaultShareImage],
    },
  };
}

// For pages that only make sense signed in, or carry personal tokens.
export const noIndex: Metadata["robots"] = { index: false, follow: false };

const organizationId = () => absoluteUrl("/#organization");
const websiteId = () => absoluteUrl("/#website");
const appId = () => absoluteUrl("/#app");

// The home page's structured data: who makes the product, the site, the
// product itself, and the FAQ shown on the page.
export function homeJsonLd(): Record<string, unknown> {
  const url = absoluteUrl("/");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId(),
        name: siteSeo.name,
        url,
        logo: { "@type": "ImageObject", url: absoluteUrl("/icons/icon-512.png"), width: 512, height: 512 },
        email: siteSeo.email,
        description: siteSeo.definition,
      },
      {
        "@type": "WebSite",
        "@id": websiteId(),
        name: siteSeo.name,
        url,
        description: siteSeo.description,
        inLanguage: "en",
        publisher: { "@id": organizationId() },
      },
      {
        "@type": "WebApplication",
        "@id": appId(),
        name: siteSeo.name,
        url,
        description: siteSeo.definition,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Web browser",
        browserRequirements: "Requires JavaScript.",
        featureList: [
          "Convert a published Framer site to a Next.js project from its URL",
          "Every page verified element by element against the original",
          "React components named after the design's sections",
          "Live preview before downloading",
          "Download the project as a ZIP",
          "One-click deploy to Vercel",
        ],
        publisher: { "@id": organizationId() },
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: pageSeo.home.title,
        description: pageSeo.home.description,
        isPartOf: { "@id": websiteId() },
        about: { "@id": appId() },
        dateModified: siteSeo.lastUpdated,
        inLanguage: "en",
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };
}

// A page's structured data: the page, where it sits in the site, and when
// it last changed.
export function pageJsonLd(page: PageSeo, lastUpdated: string): Record<string, unknown> {
  const url = absoluteUrl(page.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: page.title,
        description: page.description,
        isPartOf: { "@id": websiteId() },
        publisher: { "@id": organizationId() },
        dateModified: toIsoDate(lastUpdated),
        inLanguage: "en",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: siteSeo.name, item: absoluteUrl("/") },
          { "@type": "ListItem", position: 2, name: page.title, item: url },
        ],
      },
    ],
  };
}

// "12 November 2026" -> "2026-11-12"; anything unparseable is kept as is.
export function toIsoDate(date: string): string {
  const parsed = new Date(`${date} UTC`);
  return Number.isNaN(parsed.getTime()) ? date : parsed.toISOString().slice(0, 10);
}
