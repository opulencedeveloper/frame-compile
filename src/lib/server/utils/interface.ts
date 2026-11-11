import { NextRequest, NextResponse } from "next/server";
import { AuthPage, FetchFailureReason, MessageResponse } from "./enum";

export interface CustomHttpResponse<T = unknown> {
  status: number;
  message: MessageResponse;
  description: string;
  data: T;
}

export type Handler<C = unknown> = (req: NextRequest, context: C) => Promise<Response>;

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

export type SessionCheck =
  | { valid: true; value: SessionPayload }
  | { valid: false; response: NextResponse };

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

export interface IGitHubRepository {
  owner: string;
  name: string;
}

// A repository fetched into a temporary folder.
export interface IGitCheckout {
  directory: string;
  remove: () => Promise<void>;
  // The environment git ran with, for further git commands in the folder.
  env: NodeJS.ProcessEnv;
}

// The account the token belongs to.
export interface IGitHubAccount {
  login: string;
  id: number;
}

export interface IVercelUser {
  id: string;
  username: string;
  name?: string | null;
}

export interface IVercelTeam {
  id: string;
  slug: string;
  name: string;
}

// A file of a deployment, uploaded first and referenced by its SHA-1.
export interface IVercelFile {
  file: string;
  sha: string;
  size: number;
}

export interface IVercelRequestOptions {
  // The team to act for; null or absent for the personal account.
  teamId?: string | null;
  init?: RequestInit;
  // Statuses returned instead of thrown.
  allowedStatuses?: number[];
  timeoutMs?: number;
  query?: Record<string, string>;
}

export interface IVercelDeployment {
  id: string;
  // The deployment's own address, without the scheme.
  url: string;
  readyState: string;
  // Production domains, once assigned.
  alias?: string[];
  errorMessage?: string | null;
}

export interface FetchSuccess {
  ok: true;
  // After redirects.
  url: URL;
  status: number;
  contentType: string;
  body: Buffer;
}

export interface FetchFailure {
  ok: false;
  url: URL | null;
  reason: FetchFailureReason;
  status?: number;
}

export type FetchResult = FetchSuccess | FetchFailure;

export interface SafeFetchOptions {
  // Return 4xx/5xx responses as successes instead of failures, for callers
  // that need the body of an error page (e.g. a site's 404 page).
  acceptErrorStatus?: boolean;
  // The Accept header to send. CDNs that negotiate formats (Framer's serves
  // WebP or AVIF for the same image URL) answer according to it.
  accept?: string;
}
