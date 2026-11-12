import RequestErrorModal from "@/components/shared/RequestErrorModal";

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
