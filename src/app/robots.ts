import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

// Signed-in pages and the API stay out of search. The AI search and answer
// crawlers are named so it is explicit that they may read and cite the
// public pages; a group per crawler replaces the "*" group for it, so each
// repeats the same rules.
const PRIVATE_PATHS = ["/api/", "/dashboard"];

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "DuckAssistBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
      { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE_PATHS },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
