"use client";

import { SubmitEvent, Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/shared/Button";
import Checkbox from "@/components/shared/Checkbox";
import Input from "@/components/shared/Input";
import SectionLabel from "@/components/shared/SectionLabel";
import SmartImage from "@/components/shared/SmartImage";
import AuthErrorMessage from "@/components/auth/AuthErrorMessage";
import AuthFormError from "@/components/auth/AuthFormError";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import ArrowRight from "@/assets/icons/arrow-right.svg";
import EyeOnIcon from "@/assets/icons/eye-on.svg";
import EyeOffIcon from "@/assets/icons/eye-off.svg";
import { useHttp } from "@/hooks/useHttp";
import { AUTH_API, AUTH_RULES } from "@/constants/auth";
import { LEGAL_ROUTES } from "@/constants/legal";
import {
  authFormContent,
  marketingOptInLabel,
  termsRequiredMessage,
} from "@/resources/auth";
import { AuthFormProps, PendingVerification } from "@/types/auth";
import { clearRedirectAfterLogin, getRedirectAfterLogin } from "@/utils/auth";
import { AuthMode, MessageResponse } from "@/utils/enum";

const inputClassName =
  "h-10.75 rounded-[9px] border border-cadada8 outline-none ring-3 ring-cf0f0ed placeholder:text-caaa9a5";

export default function AuthForm({ mode, onVerificationRequired }: AuthFormProps) {
  const router = useRouter();
  const content = authFormContent[mode];
  const isSignUp = mode === AuthMode.SignUp;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const termsCheckboxRef = useRef<HTMLInputElement>(null);
  const { isLoading, error, sendHttpRequest } = useHttp();
  // Sign-up reveals the password fields once the email looks valid.
  const showPasswordFields = !isSignUp || isEmailValid;
  const isTermsError = validationError === termsRequiredMessage;

  // The checkbox can be off-screen, especially on mobile after pressing the
  // Google button at the top, so bring it (and the error under it) into view.
  const requireTerms = () => {
    setValidationError(termsRequiredMessage);
    const checkbox = termsCheckboxRef.current;
    if (!checkbox) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    checkbox.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    // preventScroll: focus would otherwise jump instantly and cut the
    // smooth scroll short.
    checkbox.focus({ preventScroll: true });
  };

  const register = (form: FormData) => {
    const body = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
      acceptTerms: termsAccepted,
      marketingOptIn,
    };

    // Checked here too so the user gets instant feedback; the API is the
    // source of truth and validates again.
    if (body.password !== body.confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }
    if (!body.acceptTerms) {
      requireTerms();
      return;
    }

    sendHttpRequest({
      requestConfig: { url: AUTH_API.REGISTER, method: "POST", body },
      successRes: (res) => onVerificationRequired(res.data.data as PendingVerification),
    });
  };

  const login = (form: FormData) => {
    const body = {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirectTo: getRedirectAfterLogin(),
    };

    sendHttpRequest({
      requestConfig: { url: AUTH_API.LOGIN, method: "POST", body },
      successRes: (res) => {
        // Right password, unverified email: the API has sent a code.
        if (res.data.message === MessageResponse.VerifyEmail) {
          onVerificationRequired(res.data.data as PendingVerification);
          return;
        }
        clearRedirectAfterLogin();
        // replace, not push: Back should not return to the sign-in form.
        router.replace(res.data.data.redirectTo);
      },
    });
  };

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setValidationError(null);
    const form = new FormData(event.currentTarget);

    // The browser's type="email" check lets "name@domain" through; the API
    // would reject it, so catch it here with the same message.
    if (!AUTH_RULES.EMAIL_PATTERN.test(String(form.get("email") ?? "").trim())) {
      setValidationError("Please enter a valid email address");
      return;
    }

    if (isSignUp) register(form);
    else login(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="md:bg-white md:border md:border-ceaeaee md:rounded-[18px]"
    >
      <div className="md:px-8.5 md:pt-8.5">
        <SectionLabel title={content.label} />
        <h1 className="leading-[33.48px] text-c0a0a0a font-hedvig-400-18 text-[24px] md:text-[28px] mt-3.25">
          {content.title}
        </h1>
        <h2 className="text-sm text-c63636d font-nunito-400 mt-2.5 mb-6.25">
          {content.description}
        </h2>
        <Suspense fallback={null}>
          <AuthErrorMessage />
        </Suspense>
        <GoogleAuthButton
          text={content.googleButtonText}
          mode={mode}
          termsAccepted={termsAccepted}
          marketingOptIn={marketingOptIn}
          onTermsRequired={requireTerms}
        />
        <div className="w-full flex items-center gap-2.5 my-[13.8px]">
          <hr className="border-t border-ceaeaee w-full" />
          <p className="text-c6c6c76 text-sm font-nunito-400">or</p>
          <hr className="border-t border-ceaeaee w-full" />
        </div>

        <div className="flex flex-col gap-3.5">
          <Input
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-label="Email"
            required
            className={inputClassName}
            onChange={(event) => {
              const isValid = AUTH_RULES.EMAIL_PATTERN.test(event.target.value.trim());
              setIsEmailValid(isValid);
              if (isValid) setValidationError(null);
            }}
          />
          {/* Hidden rather than unmounted, so a password typed before the
              user goes back to fix the email isn't lost. */}
          <div hidden={!showPasswordFields} className="flex flex-col gap-3.5">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder="Password"
              aria-label="Password"
              required
              // Disabled while hidden: the browser skips disabled fields when
              // validating, so a hidden empty `required` field can't silently
              // block the submit before the email error is shown.
              disabled={!showPasswordFields}
              minLength={isSignUp ? AUTH_RULES.PASSWORD_MIN_LENGTH : undefined}
              maxLength={AUTH_RULES.PASSWORD_MAX_LENGTH}
              className={inputClassName}
              suffixIcon={{
                src: showPassword ? EyeOnIcon : EyeOffIcon,
                alt: showPassword ? "Hide password" : "Show password",
                onClick: () => setShowPassword((show) => !show),
              }}
            />
            {isSignUp && (
              <Input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Confirm password"
                aria-label="Confirm password"
                required
                disabled={!showPasswordFields}
                maxLength={AUTH_RULES.PASSWORD_MAX_LENGTH}
                className={inputClassName}
                suffixIcon={{
                  src: showConfirmPassword ? EyeOnIcon : EyeOffIcon,
                  alt: showConfirmPassword ? "Hide password" : "Show password",
                  onClick: () => setShowConfirmPassword((show) => !show),
                }}
              />
            )}
          </div>
          {/* Outside the hidden password block: it gates the Google button
              too, which works before an email is typed. */}
          {isSignUp && (
            <>
              <Checkbox
                ref={termsCheckboxRef}
                name="acceptTerms"
                aria-invalid={isTermsError}
                checked={termsAccepted}
                onChange={(event) => {
                  setTermsAccepted(event.target.checked);
                  if (event.target.checked) {
                    setValidationError((current) =>
                      current === termsRequiredMessage ? null : current,
                    );
                  }
                }}
                label={
                  <>
                    I agree to the{" "}
                    {/* New tab, so following a link doesn't lose the form. */}
                    <Link
                      href={LEGAL_ROUTES.TERMS}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-nunito-500 text-c16161a border-b border-c16161a"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href={LEGAL_ROUTES.PRIVACY}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-nunito-500 text-c16161a border-b border-c16161a"
                    >
                      Privacy Policy
                    </Link>
                  </>
                }
              />
              {/* Optional and unticked by default: marketing needs its own,
                  freely given opt-in, separate from the terms. */}
              <Checkbox
                name="marketingOptIn"
                checked={marketingOptIn}
                onChange={(event) => setMarketingOptIn(event.target.checked)}
                label={marketingOptInLabel}
              />
            </>
          )}
        </div>

        <div className="mt-3.5">
          <AuthFormError message={validationError ?? error} />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="rounded-lg"
          rightIcon={
            <SmartImage src={ArrowRight} alt="" width={12} height={12} />
          }
        >
          {content.submitButtonText}
        </Button>
      </div>

      <div className="gap-1.5 text-sm py-4.75 mt-5.75 border-t border-ceaeaee flex items-center justify-center">
        <p className="text-c63636d font-nunito-400">{content.switchPrompt}</p>
        <Link
          href={content.switchLinkHref}
          className="font-nunito-500 border-b border-c16161a"
        >
          {content.switchLinkText}
        </Link>
      </div>
    </form>
  );
}
