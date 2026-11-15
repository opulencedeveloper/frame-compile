import Image from "next/image";
import DropDownIcon from "@/assets/icons/drop-down.svg";
import SectionLabel from "@/components/shared/SectionLabel";
import { faqContent, faqItems } from "@/resources/seo";

export default function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="mx-auto w-full max-w-max-width px-4 md:px-18 py-12.5">
      <SectionLabel title={faqContent.label} />
      <h2 id="faq-title" className="text-c0a0a0a font-hedvig-400-14 text-[24px] md:text-[38px] mb-8 md:mb-10.5">
        {faqContent.title}
      </h2>

      <div className="border-t border-ce2e3e9">
        {faqItems.map((item) => (
          <details key={item.question} className="group border-b border-ce2e3e9">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left [&::-webkit-details-marker]:hidden">
              <h3 className="text-c0a0a0a font-nunito-500 text-base md:text-[18px]">{item.question}</h3>
              <Image
                src={DropDownIcon}
                alt=""
                width={16}
                height={16}
                className="shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
              />
            </summary>
            <p className="max-w-3xl pb-6 text-c292929 font-nunito-400 text-sm md:text-base leading-relaxed">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
