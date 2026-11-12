import LegalTableOfContents from "@/components/shared/LegalTableOfContents";
import { legalContent } from "@/resources/legal";
import { LegalBlockContentProps, LegalDocumentProps } from "@/types/legal";

function LegalBlockContent({ block }: LegalBlockContentProps) {
  switch (block.type) {
    case "subheading":
      return <h3 className="mt-6 mb-1 text-c0a0a0a font-nunito-500 text-sm md:text-base">{block.text}</h3>;
    case "list":
      return (
        <ul className="list-disc pl-6 marker:text-c767676">
          {block.items.map((item) => (
            <li key={item} className="pl-1">
              {item}
            </li>
          ))}
        </ul>
      );
    case "paragraph":
      return (
        <p>
          {block.text}
          {block.link && (
            <>
              {" "}
              <a href={block.link.href} className="text-c0a0a0a font-nunito-500 hover:underline">
                {block.link.text}
              </a>
              .
            </>
          )}
        </p>
      );
  }
}

export default function LegalDocument({ content }: LegalDocumentProps) {
  return (
    <section className="mx-auto w-full max-w-max-width px-4 md:px-18 pt-8 md:pt-12 pb-16 md:pb-24">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-14">
        <aside className="w-full lg:w-80 shrink-0 lg:sticky lg:top-20 lg:self-start">
          <LegalTableOfContents sections={content.sections.map(({ id, title }) => ({ id, title }))} />
        </aside>

        <article className="min-w-0 flex-1 max-w-218">
          <header>
            <div className="flex items-center gap-2">
              <span className="shrink-0 rounded-full bg-ce9f5ff px-2.5 py-1 text-xs font-nunito-500 text-c18181b">
                {legalContent.label}
              </span>
              <span aria-hidden className="h-px flex-1 bg-ceaeaee" />
            </div>
            <h1 className="mt-5 text-c0a0a0a font-hedvig-400-14 text-[36px] md:text-[48px] leading-tight">
              {content.title}
            </h1>
            <p className="mt-4 text-sm md:text-base font-nunito-400">
              <span className="text-c8a8a8a">{legalContent.lastUpdated}</span>{" "}
              <time className="text-c292929">{content.lastUpdated}</time>
            </p>
            <p className="mt-5 text-c292929 font-nunito-400 text-sm md:text-base leading-relaxed">
              {content.intro}
            </p>
          </header>

          <div className="mt-14 space-y-14 md:space-y-16">
            {content.sections.map((section) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-20">
                <h2
                  id={`${section.id}-title`}
                  className="text-c0a0a0a font-hedvig-400-14 text-[24px] md:text-[32px] leading-tight mb-4"
                >
                  {section.title}
                </h2>
                <div className="space-y-1 text-c767676 font-nunito-400 text-sm md:text-base leading-relaxed md:leading-8">
                  {section.blocks.map((block, index) => (
                    <LegalBlockContent key={index} block={block} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
