import { cookies } from "next/headers";
import { connection } from "next/server";
import GoogleOneTap from "@/components/auth/GoogleOneTap";
import { auth } from "@/lib/server/utils/auth";
import { CookieNames } from "@/lib/server/utils/enum";

export default async function GoogleOneTapGate() {
  await connection();
  const cookieStore = await cookies();
  const userId = await auth.sessionUserId(cookieStore.get(CookieNames.UserAuthToken)?.value);
  return userId ? null : <GoogleOneTap />;
}
