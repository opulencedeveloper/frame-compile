import FinalCta from "@/components/landing/home/FinalCta";
import FloatingActionButton from "@/components/landing/home/FloatingActionButton";
import Hero from "@/components/landing/home/Hero";
import HowItWorks from "@/components/landing/home/HowItWorks";
import PerformanceHighlights from "@/components/landing/home/PerformanceHighlights";

export default function Home() {
  return <div className="w-full">
    <Hero />
    <PerformanceHighlights />
    <HowItWorks />
    <FinalCta />
    <FloatingActionButton />
  </div>;
}
