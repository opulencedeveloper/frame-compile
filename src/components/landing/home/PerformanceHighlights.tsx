import SectionLabel from "@/components/shared/SectionLabel";
import PerformanceHighlightCard from "@/components/landing/home/PerformanceHighlightCard";
import { performanceHighlights } from "@/resources/home";

export default function PerformanceHighlights() {
  return (
    <section className="mx-auto w-full max-w-max-width px-4 md:px-18 py-8 md:py-12.5">
      <SectionLabel title="Lightweight code architecture built for peak Core Web Vitals." />

      <div className="flex flex-col md:flex-row mt-8.5 md:mt-10.5 gap-7.25 md:gap-13">
        {performanceHighlights.map((highlight) => (
          <PerformanceHighlightCard key={highlight.title} {...highlight} />
        ))}
      </div>
    </section>
  );
}
