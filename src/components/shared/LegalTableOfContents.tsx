"use client";

import { useEffect, useId, useState } from "react";
import DropDownIcon from "@/assets/icons/drop-down.svg";
import SmartImage from "@/components/shared/SmartImage";
import { cn } from "@/lib/utils";
import { legalContent } from "@/resources/legal";
import { LegalTableOfContentsProps } from "@/types/legal";

const ACTIVE_LINE_RATIO = 0.3;

export default function LegalTableOfContents({ sections }: LegalTableOfContentsProps) {
  const listId = useId();
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) {
        setActiveId(sections[sections.length - 1]?.id);
        return;
      }
      const line = window.innerHeight * ACTIVE_LINE_RATIO;
      const passed = sections.filter(({ id }) => {
        const element = document.getElementById(id);
        return element && element.getBoundingClientRect().top <= line;
      });
      setActiveId(passed[passed.length - 1]?.id ?? sections[0]?.id);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  return (
    <nav
      aria-label={legalContent.tableOfContents}
      className="rounded-2xl border border-ceaeaee bg-linear-to-b from-cfbfbfb to-ceff6ff px-3.5 py-2 lg:pt-6 lg:pb-4 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto"
    >
      <p className="hidden lg:block px-3 mb-3 text-c0a0a0a font-nunito-500 text-base">
        {legalContent.tableOfContents}
      </p>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={listId}
        className="lg:hidden flex w-full items-center justify-between px-3 py-3 text-c0a0a0a font-nunito-500 text-sm"
      >
        {legalContent.tableOfContents}
        <SmartImage
          src={DropDownIcon}
          alt=""
          width={16}
          height={16}
          className={cn("transition-transform duration-200", isOpen && "rotate-180")}
        />
      </button>
      <ol id={listId} className={cn("space-y-1 pb-2 lg:pb-0", isOpen ? "block" : "hidden lg:block")}>
        {sections.map((section, index) => {
          const isActive = section.id === activeId;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={() => {
                  setActiveId(section.id);
                  setIsOpen(false);
                }}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "flex gap-1.5 rounded-lg px-3 py-2.5 text-sm font-nunito-400 transition-colors",
                  isActive ? "bg-c0a0a0a text-white" : "text-c18181b hover:bg-white/70",
                )}
              >
                <span>{index + 1}.</span>
                <span>{section.title}</span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
