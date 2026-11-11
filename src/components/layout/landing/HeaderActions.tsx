import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { auth } from "@/lib/server/utils/auth";
import { CookieNames } from "@/lib/server/utils/enum";
import { DASHBOARD_ROUTE } from "@/constants/auth";
import { headerButtonClassName, headerLinkClassName } from "./headerStyles";

const signedOutActions = (
  <>
    <Link href="/sign-in" className={headerLinkClassName}>
      Sign In
    </Link>
    <Link href="/" className={headerButtonClassName}>
      Convert Next.js
    </Link>
  </>
);

async function SessionActions() {
  await connection();
  const cookieStore = await cookies();
  const userId = await auth.sessionUserId(cookieStore.get(CookieNames.UserAuthToken)?.value);

  return userId ? (
    <Link href={DASHBOARD_ROUTE} className={headerButtonClassName}>
      Dashboard
    </Link>
  ) : (
    signedOutActions
  );
}

export default function HeaderActions() {
  return (
    <Suspense fallback={signedOutActions}>
      <SessionActions />
    </Suspense>
  );
}
