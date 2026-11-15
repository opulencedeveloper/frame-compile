import { heroBackground } from "@/assets/images/hero-bg-inline";
import AuthHeader from "@/components/layout/auth/AuthHeader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      style={{ backgroundImage: `url(${heroBackground})` }}
      className="relative isolate min-h-dvh bg-cover bg-center"
    >
      <AuthHeader />
      {children}
    </main>
  );
}
