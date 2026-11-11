import ConversionsBoard from "./ConversionsBoard";
import MobileHeader from "./MobileHeader";
import { SidebarNav } from "./SidebarNav";

export default function DashboardContent() {
  return (
    <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden">
      <MobileHeader>
        <SidebarNav />
      </MobileHeader>
      <ConversionsBoard />
    </div>
  );
}
