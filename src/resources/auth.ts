import { AuthFormContent, OtpFormContent } from "@/types/auth";
import { AUTH_RULES } from "@/constants/auth";

export const otpFormContent: OtpFormContent = {
  title: "Enter OTP code",
  description: `We sent a ${AUTH_RULES.OTP_LENGTH}-digit code to`,
  submitButtonText: "Verify",
  resendPrompt: "Didn't see it?",
  resendButtonText: "Resend code",
};
import { AuthErrorCode, AuthMode } from "@/utils/enum";

export const authErrorMessages: Record<AuthErrorCode, string> = {
  [AuthErrorCode.GoogleAuthFailed]:
    "Something went wrong with Google. Please try again.",
  [AuthErrorCode.GoogleAuthCancelled]: "Google authentication was cancelled.",
  [AuthErrorCode.GoogleEmailUnverified]:
    "Your Google email isn't verified. Verify it with Google, then try again.",
  [AuthErrorCode.GoogleAccountConflict]:
    "This email is linked to a different Google account. Sign in with that account instead.",
  [AuthErrorCode.GoogleAccountNotFound]:
    "No account found for this Google account. Sign up to create one.",
};

export const termsRequiredMessage =
  "Please accept the Terms of Service and Privacy Policy to continue";

export const marketingOptInLabel =
  "Send me product updates and offers. Unsubscribe anytime.";

export const authFormContent: Record<AuthMode, AuthFormContent> = {
  [AuthMode.SignIn]: {
    label: "Sign in",
    title: "Sign in to continue",
    description:
      "See your save projects, download exports, and deploy when ready.",
    googleButtonText: "Sign in with Google",
    submitButtonText: "Login",
    switchPrompt: "Don't have an account?",
    switchLinkText: "Sign up",
    switchLinkHref: "/sign-up",
  },
  [AuthMode.SignUp]: {
    label: "Sign up",
    title: "Start converting Framer sites.",
    description:
      "Sign up to save projects, download exports, and deploy when ready.",
    googleButtonText: "Sign up with Google",
    submitButtonText: "Sign Up with email",
    switchPrompt: "Already have an account?",
    switchLinkText: "Sign in",
    switchLinkHref: "/sign-in",
  },
};
