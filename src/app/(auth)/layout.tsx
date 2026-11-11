import Image from "next/image";
import heroBg from "@/assets/images/hero-bg.png";
import AuthHeader from "@/components/layout/auth/AuthHeader";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative isolate min-h-dvh">
      <Image
        src={heroBg}
        alt=""
        aria-hidden
        fill
        sizes="100vw"
        placeholder="blur"
        loading="eager"
        fetchPriority="high"
        className="-z-10 object-cover object-center"
      />
      <AuthHeader />
      {children}
    </main>
  );
}
