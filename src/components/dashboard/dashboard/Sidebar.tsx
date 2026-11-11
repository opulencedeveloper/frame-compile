import { SidebarNav } from "@/components/dashboard/dashboard/SidebarNav";

export function Sidebar() {
  return (
    <aside className="hidden md:block w-52 shrink-0 h-full overflow-y-auto pt-8">
      <SidebarNav />
    </aside>
  );
}
