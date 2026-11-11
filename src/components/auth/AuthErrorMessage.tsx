"use client";

import { useSearchParams } from "next/navigation";
import AuthFormError from "@/components/auth/AuthFormError";
import { AUTH_QUERY_KEYS } from "@/constants/auth";
import { authErrorMessages } from "@/resources/auth";
import { AuthErrorCode } from "@/utils/enum";

const isAuthErrorCode = (code: string | null): code is AuthErrorCode =>
  Object.values<string | null>(AuthErrorCode).includes(code);

// Shows the error the API redirected back with (`/sign-in?error=...`).
// Unknown codes render nothing, so a crafted URL can't inject text.
export default function AuthErrorMessage() {
  const code = useSearchParams().get(AUTH_QUERY_KEYS.ERROR);
  return <AuthFormError message={isAuthErrorCode(code) ? authErrorMessages[code] : null} />;
}
