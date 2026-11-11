import Image from "next/image";
import heroBg from "@/assets/images/hero-bg.png";
import ExclusiveBadge from "@/components/shared/ExclusiveBadge";
import FramerUrlForm from "@/components/shared/FramerUrlForm";
import { DASHBOARD_ROUTE } from "@/constants/auth";

export default function Hero() {
  return (
    <section className="relative px-4 md:px-18 isolate overflow-hidden pt-19.5 pb-8.25 md:py-36.25 w-full">
      <Image
        src={heroBg}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        placeholder="blur"
        loading="eager"
        fetchPriority="high"
        className="-z-10 object-cover object-center"
      />

      <div className="max-w-3xl w-full mx-auto flex flex-col justify-center items-center">
        <ExclusiveBadge className="mb-7" />

        <h1 className="text-c0a0a0a leading-11 md:leading-13.5 font-hedvig-400-14 text-center text-[32px] md:text-[48px] mb-5">
          Turn your Framer designs into clean HTML and Next.js code
        </h1>
        <h2 className="w-full max-w-lg mx-auto text-c292929 font-nunito-400 text-sm md:text-[18px] text-center">
          Export Framer sites into lightweight, production-grade HTML or Next.js code ready to deploy anywhere.
        </h2>
        <FramerUrlForm submitHref={DASHBOARD_ROUTE} />
      </div>
    </section>
  );
}
