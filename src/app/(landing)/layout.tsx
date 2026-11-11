import Footer from "@/components/layout/landing/Footer";
import Header from "@/components/layout/landing/Header";
import HeaderActions from "@/components/layout/landing/HeaderActions";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <Header actions={<HeaderActions />} />
      {children}
      <Footer />
    </main>
  );
}
