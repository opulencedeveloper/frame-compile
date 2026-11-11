import { AuthMode } from "@/utils/enum";

// Returned by the register and resend-otp endpoints.
export interface PendingVerification {
  email: string;
  resendAvailableInSeconds: number;
}

export interface AuthFlowProps {
  mode: AuthMode;
}

export interface AuthFormProps {
  mode: AuthMode;
  // Called when the email still needs an OTP: after sign-up, or after a
  // sign-in to an account that was never verified.
  onVerificationRequired: (pendingVerification: PendingVerification) => void;
}

export type EnterOTPProps = PendingVerification;

export interface AuthFormErrorProps {
  message: string | null;
}

export interface OtpFormContent {
  title: string;
  description: string;
  submitButtonText: string;
  resendPrompt: string;
  resendButtonText: string;
}

export interface GoogleAuthButtonProps {
  text: string;
  // The page the button is on; Google failures redirect back to it.
  mode: AuthMode;
  // Sign-up only: the button does nothing until the terms are accepted.
  termsAccepted?: boolean;
  marketingOptIn?: boolean;
  onTermsRequired?: () => void;
}

export interface AuthFormContent {
  label: string;
  title: string;
  description: string;
  googleButtonText: string;
  submitButtonText: string;
  switchPrompt: string;
  switchLinkText: string;
  switchLinkHref: string;
}
