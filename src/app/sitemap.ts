import type { MetadataRoute } from "next";
import { absoluteUrl, toIsoDate } from "@/lib/seo";
import { privacyPolicy, termsOfService } from "@/resources/legal";
import { pageSeo, siteSeo } from "@/resources/seo";

// The public pages, each with the date its content last changed.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl(pageSeo.home.path), lastModified: siteSeo.lastUpdated, priority: 1 },
    { url: absoluteUrl(pageSeo.signUp.path), lastModified: siteSeo.lastUpdated, priority: 0.6 },
    { url: absoluteUrl(pageSeo.privacy.path), lastModified: toIsoDate(privacyPolicy.lastUpdated), priority: 0.3 },
    { url: absoluteUrl(pageSeo.terms.path), lastModified: toIsoDate(termsOfService.lastUpdated), priority: 0.3 },
  ];
}
