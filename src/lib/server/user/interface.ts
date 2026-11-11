import { HydratedDocument } from "mongoose";
import { AuthProvider, GoogleUserStatus } from "../auth/enum";

// A pending email verification. The code itself is never stored, only its hash.
export interface IEmailVerification {
  codeHash: string;
  expiresAt: Date;
  sentAt: Date;
  attempts: number;
  // Set when a Google-only user adds a password. Applied only once the code
  // proves they own the inbox, so register can never change a live account.
  pendingPasswordHash?: string;
}

// Opt-in to marketing emails, kept separate from the terms: accepting the
// terms is not consent to marketing. The dates are the record of consent.
export interface IMarketingConsent {
  granted: boolean;
  grantedAt?: Date;
  revokedAt?: Date;
}

// What the user agreed to on the sign-up page.
export interface ISignUpConsent {
  termsAcceptedAt: Date;
  marketingConsent: IMarketingConsent;
}

export interface IUser {
  email: string;
  password?: string;
  name?: string;
  avatarUrl?: string;
  googleId?: string;
  authProviders: AuthProvider[];
  isEmailVerified: boolean;
  emailVerification?: IEmailVerification;
  // When the user agreed to the Terms of Service and Privacy Policy.
  termsAcceptedAt: Date;
  marketingConsent: IMarketingConsent;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

export type GoogleUserLookup =
  | { status: GoogleUserStatus.Found; user: UserDocument }
  | { status: GoogleUserStatus.NotFound | GoogleUserStatus.Conflict };