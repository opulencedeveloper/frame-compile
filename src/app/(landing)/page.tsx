import { Metadata } from "next";
import Faq from "@/components/landing/home/Faq";
import FinalCta from "@/components/landing/home/FinalCta";
import FloatingActionButton from "@/components/landing/home/FloatingActionButton";
import Hero from "@/components/landing/home/Hero";
import HowItWorks from "@/components/landing/home/HowItWorks";
import PerformanceHighlights from "@/components/landing/home/PerformanceHighlights";
import JsonLd from "@/components/shared/JsonLd";
import { homeJsonLd, pageMetadata } from "@/lib/seo";
import { pageSeo } from "@/resources/seo";

export const metadata: Metadata = pageMetadata(pageSeo.home, { absoluteTitle: true });

export default function Home() {
  return (
    <div className="w-full">
      <JsonLd data={homeJsonLd()} />
      <Hero />
      <PerformanceHighlights />
      <HowItWorks />
      <Faq />
      <FinalCta />
      <FloatingActionButton />
    </div>
  );
}
