import Link from "next/link";
import AppLogo from "@/components/shared/AppLogo";
import { HeaderProps } from "@/types/layout";
import { headerLinkClassName } from "./headerStyles";

export default function Header({ actions, authLinkHref = "/sign-in", authLinkText = "Sign In" }: HeaderProps) {
  return (
    <header className="sticky top-0 z-5 mx-auto w-full max-w-max-width px-4 md:px-18 bg-white h-13.25 flex items-center justify-between">
      <AppLogo />

      <div className="flex">
        {actions ?? (
          <Link href={authLinkHref} className={headerLinkClassName}>
            {authLinkText}
          </Link>
        )}
      </div>
    </header>
  );
}
