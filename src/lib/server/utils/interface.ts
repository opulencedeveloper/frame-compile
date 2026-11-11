import { NextRequest } from "next/server";
import { AuthPage, MessageResponse } from "./enum";

export interface CustomHttpResponse<T = unknown> {
  status: number;
  message: MessageResponse;
  description: string;
  data: T;
}

export type Handler = (req: NextRequest) => Promise<Response>;

export type LogMetadata = Record<string, unknown>;

export interface ScryptParams {
  N: number;
  r: number;
  p: number;
}

export interface IEmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export type IMarketingEmailContent = Omit<IEmailPayload, "to" | "headers">;

// The fields of a user that sending them marketing depends on.
export interface IMarketingRecipient {
  id: string;
  email: string;
  marketingConsent: { granted: boolean };
}

export interface SessionPayload {
  userId: string;
}

// Stored in a short-lived httpOnly cookie between the redirect to Google and
// the callback, so the callback can prove it answers a request we started.
export interface GoogleOAuthState {
  state: string;
  nonce: string;
  codeVerifier: string;
  redirectTo: string;
  authPage: AuthPage;
  // The sign-up page's optional marketing checkbox, applied if the flow
  // creates an account.
  marketingOptIn: boolean;
}

export interface GoogleTokenResponse {
  id_token?: string;
}

export interface GoogleProfile {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name?: string;
  avatarUrl?: string;
}
