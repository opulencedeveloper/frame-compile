import ArrowUpRight from "@/assets/icons/arrow-up-right.svg";
import SmartImage from "@/components/shared/SmartImage";
import { FooterLinkItem } from "@/types/layout";

export default function FooterLink({ label, text, href }: FooterLinkItem) {
  return (
    <div className="flex flex-col items-center justify-center">
      <p className="text-sm font-nunito-400 text-c8a8a8a">{label}</p>
      <a href={href} className="flex items-center gap-1">
        <span className="text-base font-nunito-400">{text}</span>
        <SmartImage
          src={ArrowUpRight}
          alt="ArrowUpRight"
          width={12}
          height={12}
          preload={true}
          className="h-3 w-3"
        />
      </a>
    </div>
  );
}
