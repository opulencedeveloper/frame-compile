"use client";

import { useEffect, useState } from "react";
import BackLink from "@/components/shared/BackLink";
import AuthForm from "@/components/auth/AuthForm";
import EnterOTP from "@/components/auth/EnterOTP";
import { AuthFlowProps, PendingVerification } from "@/types/auth";
import { rememberRedirectFromQuery } from "@/utils/auth";

// Email sign-in and sign-up are two steps on one page: the form, then the
// OTP when the email still needs verifying. Google auth leaves the page and
// never reaches step two.
export default function AuthFlow({ mode }: AuthFlowProps) {
  const [pendingVerification, setPendingVerification] = useState<PendingVerification | null>(null);

  useEffect(() => {
    rememberRedirectFromQuery();
  }, []);

  return (
    <section className="px-4 md:px-18 w-full">
      <div className="w-full max-w-115 mx-auto mt-0 mb-20 md:my-10.25">
        {/* On the OTP step, Back returns to the form instead of leaving the page. */}
        <BackLink
          className="mb-9.5 md:mb-3.5"
          onBack={pendingVerification ? () => setPendingVerification(null) : undefined}
        />
        {pendingVerification ? (
          <EnterOTP {...pendingVerification} />
        ) : (
          <AuthForm mode={mode} onVerificationRequired={setPendingVerification} />
        )}
      </div>
    </section>
  );
}
