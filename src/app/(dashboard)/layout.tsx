import { Metadata } from "next";
import RequestErrorModal from "@/components/shared/RequestErrorModal";
import { noIndex } from "@/lib/seo";

// Signed-in pages: never in search results.
export const metadata: Metadata = {
  title: "Dashboard",
  robots: noIndex,
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main data-fixed-viewport className="h-dvh overflow-hidden">
      {children}
      <RequestErrorModal />
    </main>
  );
}
