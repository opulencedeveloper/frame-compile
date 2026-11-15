import { ogImageContentType, ogImageSize, renderOgImage } from "@/lib/og-image";
import { pageSeo, siteSeo } from "@/resources/seo";

export const alt = `${pageSeo.terms.title} | ${siteSeo.name}`;
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage({ title: pageSeo.terms.title, subtitle: pageSeo.terms.description });
}
