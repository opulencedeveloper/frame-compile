"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/landing/Header";

export default function AuthHeader() {
  const pathname = usePathname();
  const isSignUpPage = pathname === "/sign-up";

  return (
    <Header
      authLinkHref={isSignUpPage ? "/sign-in" : "/sign-up"}
      authLinkText={isSignUpPage ? "Sign in" : "Sign up"}
    />
  );
}
