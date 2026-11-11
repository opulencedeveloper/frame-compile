import { AuthPage } from "../utils/enum";

export interface IGoogleAuthStartQuery {
  redirectTo?: string;
  authPage?: AuthPage;
  acceptTerms?: boolean;
  marketingOptIn?: boolean;
}

export interface IGoogleAuthCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
}

export interface IRegisterInput {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
  marketingOptIn: boolean;
}

export interface IVerifyEmailInput {
  email: string;
  otp: string;
  redirectTo?: string;
}

export interface ILoginInput {
  email: string;
  password: string;
  redirectTo?: string;
}

export interface IResendOtpInput {
  email: string;
}
