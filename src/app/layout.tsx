import type { Metadata, Viewport } from "next";
import { preload } from "react-dom";
import "./globals.css";
import ClientProvider from "@/components/shared/ClientProvider";
import { siteUrl } from "@/lib/seo";
import { siteSeo } from "@/resources/seo";

// The fonts above the fold, fetched alongside the HTML instead of after
// the CSS is parsed.
const CRITICAL_FONTS = [
  "/assets/fonts/Nunito-Regular.woff2",
  "/assets/fonts/Nunito-Medium.woff2",
  "/assets/fonts/HedvigLettersSerif_14pt-Regular.woff2",
];

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: `${siteSeo.name}: ${siteSeo.tagline}`,
    template: `%s | ${siteSeo.name}`,
  },
  description: siteSeo.description,
  applicationName: siteSeo.name,
  creator: siteSeo.name,
  publisher: siteSeo.name,
  category: siteSeo.category,
  manifest: "/manifest.webmanifest",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    siteName: siteSeo.name,
    locale: siteSeo.locale,
    title: `${siteSeo.name}: ${siteSeo.tagline}`,
    description: siteSeo.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteSeo.name}: ${siteSeo.tagline}`,
    description: siteSeo.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#FFFFFF",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  for (const href of CRITICAL_FONTS) {
    preload(href, { as: "font", type: "font/woff2", crossOrigin: "anonymous" });
  }

  return (
    <html lang="en" data-scroll-behavior="smooth" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
