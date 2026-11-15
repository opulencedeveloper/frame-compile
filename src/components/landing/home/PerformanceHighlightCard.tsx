import RoundedCodeFileIcon from "@/assets/icons/rounded-code-file.svg";
import RoundedDoubleCheckIcon from "@/assets/icons/rounded-doublecheck.svg";
import SmartImage from "@/components/shared/SmartImage";
import { PerformanceHighlight } from "@/types/home";

export default function PerformanceHighlightCard({
  title,
  description,
}: PerformanceHighlight) {
  return (
    <li className="border-l border-l-ce2e3e9 pl-7 md:pb-5.5">
      <h3 className="text-c6155f5 font-nunito-500 text-sm md:text-base">{title}</h3>
      <div className="mt-3 mb-3.5 md:mt-8 md:mb-5 relative">
        <SmartImage
          src={RoundedDoubleCheckIcon}
          alt=""
          width={48}
          height={48}
          className="w-12 h-12 shrink-0"
        />
        <SmartImage
          src={RoundedCodeFileIcon}
          alt=""
          width={48}
          height={48}
          containerClassName="absolute top-0 left-10.25"
          className="w-12 h-12 shrink-0"
        />
      </div>
      <p className="w-full max-w-100 text-c292929 font-nunito-400 text-sm md:text-base">{description}</p>
    </li>
  );
}
