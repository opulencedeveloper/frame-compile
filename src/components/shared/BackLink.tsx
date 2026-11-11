"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import SmartImage from "@/components/shared/SmartImage";
import AngleLeft from "@/assets/icons/angle-left.svg";
import { BackLinkProps } from "@/types/shared";

function canGoBackInApp() {
  const { navigation } = window as Window & {
    navigation?: { canGoBack: boolean };
  };
  if (navigation) return navigation.canGoBack;

  return (
    window.history.length > 1 &&
    document.referrer.startsWith(window.location.origin)
  );
}

export default function BackLink({
  fallbackHref = "/",
  className,
  children = "Back",
  onBack,
}: BackLinkProps) {
  const router = useRouter();

  return (
    <Link
      href={fallbackHref}
      onClick={(event) => {
        if (onBack) {
          event.preventDefault();
          onBack();
        } else if (canGoBackInApp()) {
          event.preventDefault();
          router.back();
        }
      }}
      className={cn(
        "inline-flex h-10 w-max items-center gap-2 text-sm text-c040406 font-nunito-500 transition-opacity hover:opacity-90",
        className
      )}
    >
      <SmartImage src={AngleLeft} alt="" width={24} height={24} />
      {children}
    </Link>
  );
}
