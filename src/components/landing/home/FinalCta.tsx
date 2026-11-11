import Image from "next/image";
import FramerUrlForm from "@/components/shared/FramerUrlForm";
import ConvertVisualFramerSitesBg from "@/assets/images/convert-visual-framer-sites.png";

export default function FinalCta() {
  return (
    <section className="relative mx-auto w-full max-w-max-width px-4 md:px-18 py-19.75 md:pt-23.5 md:pb-29.25">
       <Image
        src={ConvertVisualFramerSitesBg}
        alt="ConvertVisualFramerSitesBg"
        aria-hidden
        fill
        sizes="100vw"
        placeholder="blur"
        loading="eager"
        fetchPriority="high"
        className="-z-10 object-cover object-center"
      />
      <div className="max-w-3xl w-full mx-auto">
        <h3 className="text-[24px] md:text-[38px] font-hedvig-400-14 text-c0a0a0a text-center mb-5">
          Convert visual Framer sites into structured code for web deployment.
        </h3>
        <p className="w-full max-w-lg mx-auto text-base md:text-[18px] font-nunito-400 text-c292929 text-center mb-5.5">
          Export Framer sites into lightweight, production-grade HTML or Next.js code ready to deploy anywhere.
        </p>
        <FramerUrlForm />
      </div>
    </section>
  );
}
