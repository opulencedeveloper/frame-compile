import { ogImageContentType, ogImageSize, renderOgImage } from "@/lib/og-image";
import { siteSeo } from "@/resources/seo";

export const alt = `${siteSeo.name}: ${siteSeo.tagline}`;
export const size = ogImageSize;
export const contentType = ogImageContentType;

export default function Image() {
  return renderOgImage({
    title: siteSeo.tagline,
    subtitle: "Paste your Framer URL and get a production-ready Next.js project you can preview, download or deploy.",
  });
}
