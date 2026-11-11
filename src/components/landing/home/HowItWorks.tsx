import SectionLabel from "@/components/shared/SectionLabel";
import HowItWorksStepCard from "@/components/landing/home/HowItWorksStepCard";
import { howItWorksSteps } from "@/resources/home";

export default function HowItWorks() {
  return (
    <section className="mx-auto w-full max-w-max-width px-4 md:px-18 py-12.5">
      <SectionLabel title="How it works" />
      <h3 className="text-c0a0a0a font-hedvig-400-14 text-[24px] md:text-[38px] mb-10.5">
        Designed for Instant Conversion
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-7.25 md:gap-13">
        {howItWorksSteps.map((step, index) => (
          <HowItWorksStepCard key={step.title} step={index + 1} {...step} />
        ))}
      </div>
    </section>
  );
}
