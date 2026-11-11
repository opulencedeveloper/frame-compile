import Footer from "@/components/layout/landing/Footer";
import Header from "@/components/layout/landing/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main data-fixed-viewport className="h-dvh overflow-hidden">
      {children}
    </main>
  );
}
