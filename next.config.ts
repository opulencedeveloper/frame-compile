import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  // Don't advertise the framework (X-Powered-By: Next.js).
  poweredByHeader: false,
  outputFileTracingIncludes: {
    "/*": ["node_modules/playwright-core/**/*"],
  },
  cacheComponents: true,
  // AVIF first: the smallest images for the browsers that support it.
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      // Font files are renamed if they ever change, so browsers keep them.
      {
        source: "/assets/fonts/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/icons/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
    ];
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
