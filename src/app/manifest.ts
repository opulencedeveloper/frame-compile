import type { MetadataRoute } from "next";
import { siteSeo } from "@/resources/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteSeo.name,
    short_name: siteSeo.name,
    description: siteSeo.description,
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#FFFFFF",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
