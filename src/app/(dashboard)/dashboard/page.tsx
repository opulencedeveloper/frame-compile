import DashboardContent from "@/components/dashboard/dashboard/DashboardContent";
import { Profile } from "@/components/dashboard/dashboard/Profile";
import { Sidebar } from "@/components/dashboard/dashboard/Sidebar";

export default function Dashboard() {
  return (
    <section className="w-full px-4 md:px-6 h-full">
      <div className="flex gap-10.5 w-full max-w-max-width mx-auto h-full">
        <Sidebar />
        <DashboardContent />
        <Profile />
      </div>
    </section>
  );
}
