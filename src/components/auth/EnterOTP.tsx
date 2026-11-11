"use client";

import { SubmitEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import SmartImage from "@/components/shared/SmartImage";
import AuthFormError from "@/components/auth/AuthFormError";
import ArrowRight from "@/assets/icons/arrow-right.svg";
import { useHttp } from "@/hooks/useHttp";
import { AUTH_API, AUTH_RULES } from "@/constants/auth";
import { otpFormContent } from "@/resources/auth";
import { EnterOTPProps, PendingVerification } from "@/types/auth";
import { clearRedirectAfterLogin, getRedirectAfterLogin } from "@/utils/auth";

export default function EnterOTP({ email, resendAvailableInSeconds }: EnterOTPProps) {
  const router = useRouter();
  const verify = useHttp();
  const resend = useHttp();
  const [secondsUntilResend, setSecondsUntilResend] = useState(resendAvailableInSeconds);
  const [notice, setNotice] = useState<string | null>(null);

  // while the API would reject it anyway.
  useEffect(() => {
    if (secondsUntilResend <= 0) return;
    const timer = setTimeout(() => setSecondsUntilResend((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsUntilResend]);

  const handleVerify = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    const otp = String(new FormData(event.currentTarget).get("otp") ?? "");

    verify.sendHttpRequest({
      requestConfig: {
        url: AUTH_API.VERIFY_EMAIL,
        method: "POST",
        body: { email, otp, redirectTo: getRedirectAfterLogin() },
      },
      successRes: (res) => {
        clearRedirectAfterLogin();
        // replace, not push: Back should not return to a used code screen.
        router.replace(res.data.data.redirectTo);
      },
    });
  };

  const handleResend = () => {
    setNotice(null);

    resend.sendHttpRequest({
      requestConfig: { url: AUTH_API.RESEND_OTP, method: "POST", body: { email } },
      successRes: (res) => {
        const data = res.data.data as PendingVerification;
        setSecondsUntilResend(data.resendAvailableInSeconds);
        setNotice(res.data.description);
      },
      errorRes: (errorResponse) => {
        const retryAfterSeconds = errorResponse.data?.data?.retryAfterSeconds;
        if (typeof retryAfterSeconds === "number") setSecondsUntilResend(retryAfterSeconds);
      },
    });
  };

  const canResend = secondsUntilResend <= 0 && !resend.isLoading;

  return (
    <form
      onSubmit={handleVerify}
      className="md:bg-white md:border md:border-ceaeaee md:rounded-[18px]"
    >
      <div className="md:px-8.5 md:pt-8.5">
        <h1 className="leading-[33.48px] text-c0a0a0a font-hedvig-400-18 text-[24px] md:text-[31px] mt-3.25">
          {otpFormContent.title}
        </h1>
        <h2 className="text-sm text-c63636d font-nunito-400 mt-2.5 mb-6.25">
          {otpFormContent.description}{" "}
          <span className="text-c0a0a0a font-nunito-500">{email}</span>
        </h2>

        <div className="flex flex-col gap-3.5">
          <Input
            name="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern={`\\d{${AUTH_RULES.OTP_LENGTH}}`}
            maxLength={AUTH_RULES.OTP_LENGTH}
            title={`Enter the ${AUTH_RULES.OTP_LENGTH}-digit code`}
            aria-label="Verification code"
            placeholder="- - - - - -"
            required
            autoFocus
            className="text-center h-10.75 rounded-[9px] border border-cadada8 outline-none ring-3 ring-cf0f0ed placeholder:text-caaa9a5"
          />
        </div>

        <div className="mt-3.5">
          <AuthFormError message={verify.error ?? resend.error} />
          {notice && (
            <p role="status" className="text-[13px] text-c63636d font-nunito-400 mb-3.5">
              {notice}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={verify.isLoading}
          aria-busy={verify.isLoading}
          className="rounded-lg"
          rightIcon={
            <SmartImage src={ArrowRight} alt="" width={12} height={12} />
          }
        >
          {otpFormContent.submitButtonText}
        </Button>
      </div>

      <div className="gap-1.5 text-sm py-4.75 mt-5.75 border-t border-ceaeaee flex items-center justify-center">
        <p className="text-c63636d font-nunito-400">{otpFormContent.resendPrompt}</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={!canResend}
          className="font-nunito-500 border-b border-c16161a disabled:cursor-not-allowed disabled:opacity-50"
        >
          {secondsUntilResend > 0
            ? `${otpFormContent.resendButtonText} in ${secondsUntilResend}s`
            : otpFormContent.resendButtonText}
        </button>
      </div>
    </form>
  );
}
