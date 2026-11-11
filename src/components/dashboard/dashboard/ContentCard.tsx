import SmartImage from "@/components/shared/SmartImage";
import ActionMenu from "@/components/dashboard/dashboard/ActionMenu";
import MoreHortz from "@/assets/icons/more-hortz.svg";
import { siteActionItems } from "@/resources/dashboard";

export default function ContentCard() {
  return (
    <div className="w-full">
      <div className="w-full h-58.5 rounded-xl mb-2.5 border"></div>
      <div className="flex justify-between">
        <div className="space-y-0.5">
          <p className="text-c0a0a0a font-nunito-500 text-sm">
            samuelologwu.framer.website
          </p>
          <p className="text-c666666 text-xs font-nunito-400">
            React · 10d ago
          </p>
        </div>

        <ActionMenu items={siteActionItems} aria-label="Site actions">
          <SmartImage
            alt=""
            height={28}
            width={32}
            src={MoreHortz}
            className="w-9 h-8"
          />
        </ActionMenu>
      </div>
    </div>
  );
}
