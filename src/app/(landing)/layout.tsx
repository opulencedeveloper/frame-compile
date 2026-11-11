import Footer from "@/components/layout/landing/Footer";
import Header from "@/components/layout/landing/Header";

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <Header />
      {children}
      <Footer />
    </main>
  );
}
