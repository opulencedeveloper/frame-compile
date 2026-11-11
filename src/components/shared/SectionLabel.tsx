import TriangleIcon from "@/assets/icons/triangle.svg";
import SmartImage from "@/components/shared/SmartImage";
import { SectionLabelProps } from "@/types/shared";

export default function SectionLabel({ title }: SectionLabelProps) {
  return (
    <div className="flex items-center gap-2">
      <SmartImage
        src={TriangleIcon}
        alt=""
        containerClassName="shrink-0"
      />
      <h2 className="text-c2e3038 text-sm font-nunito-400">{title}</h2>
    </div>
  );
}
