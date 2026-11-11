import Input from "@/components/shared/Input";
import DropdownInput from "@/components/shared/DropdownInput";
import { siteFilterOptions } from "@/resources/dashboard";
import { SiteFilter } from "@/utils/enum";
import ContentCard from "./ContentCard";
import NewConvertButton from "./NewConvertButton";
import MobileHeader from "./MobileHeader";
import { SidebarNav } from "./SidebarNav";

export default function DashboardContent() {
  return (
    <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
      <MobileHeader>
        <SidebarNav />
      </MobileHeader>
      <div className="h-max w-full shrink-0 bg-white mt-8 mb-5 flex flex-col min-[822px]:flex-row gap-2 justify-between">
        <div className="flex gap-3 h-8.5 min-[822px]:h-10">
          <Input
            className="h-full w-full min-[822px]:w-52"
            placeholder="Search sites…"
            aria-label="Search sites"
          />
          <DropdownInput
            className="h-full w-39"
            options={siteFilterOptions}
            defaultValue={SiteFilter.All}
            aria-label="Filter sites"
          />
        </div>

        <NewConvertButton />
      </div>

      <div className="flex-1 min-h-0 w-full pb-20 overflow-y-auto scrollbar-hidden grid grid-cols-1 lg:grid-cols-2 content-start gap-x-5 gap-y-6 md:gap-y-8">
        <ContentCard />
        <ContentCard />
        <ContentCard />
        <ContentCard />
         <ContentCard />
        <ContentCard />
        <ContentCard />
        <ContentCard />
      </div>
    </div>
  );
}
