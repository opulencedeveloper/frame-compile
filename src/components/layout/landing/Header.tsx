import Link from "next/link";
import AppLogo from "@/components/shared/AppLogo";
import { HeaderProps } from "@/types/layout";

const linkClassName =
  "inline-flex h-8 w-max shrink-0 items-center justify-center px-4 font-nunito-500 text-sm text-c040406 transition-opacity hover:opacity-90";

export default function Header({
  showConvertLink = true,
  authLinkHref = "/sign-in",
  authLinkText = "Sign In",
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-5 mx-auto w-full max-w-max-width px-4 md:px-18 bg-white h-13.25 flex items-center justify-between">
      <AppLogo />

      <div className="flex">
        <Link href={authLinkHref} className={linkClassName}>
          {authLinkText}
        </Link>
        {showConvertLink && (
          <Link href="/" className={`${linkClassName} bg-cdcdce1 rounded-md`}>
            Convert Next.js
          </Link>
        )}

      </div>
    </header>
  );
}
