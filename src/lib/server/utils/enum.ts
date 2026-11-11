export enum MessageResponse {
  Error = "error",
  Success = "success",
  // Login succeeded but the email must be verified with an OTP first.
  VerifyEmail = "verify_email",
}

export enum LogLevel {
  Info = "info",
  Warn = "warn",
  Error = "error",
  Debug = "debug",
}

export enum EmailVerificationPurpose {
  // A new email/password account.
  SignUp = "sign-up",
  // A password being added to an existing Google-only account.
  AddPassword = "add-password",
}

// Every JWT is signed with the same secret, so each kind carries its own
// audience and is verified against it: an unsubscribe token can never be
// used as a session, or the other way round.
export enum TokenAudience {
  Session = "session",
  Unsubscribe = "unsubscribe",
}

export enum FetchFailureReason {
  InvalidUrl = "invalid_url",
  // A private, loopback or otherwise non-public address, or a non-default
  // port: refused so user-supplied URLs can't reach internal services.
  BlockedAddress = "blocked_address",
  HttpError = "http_error",
  TooManyRedirects = "too_many_redirects",
  TooLarge = "too_large",
  Timeout = "timeout",
  NetworkError = "network_error",
}

export enum CookieNames {
  UserAuthToken = "user_auth_token",
  GoogleOAuthState = "google_oauth_state",
}

// The page a Google flow started from, so failures return there. The values
// are the page paths. Mirrors AuthMode in src/utils/enum.ts.
export enum AuthPage {
  SignIn = "sign-in",
  SignUp = "sign-up",
}

export enum AuthErrorCode {
  GoogleAuthFailed = "google_auth_failed",
  GoogleAuthCancelled = "google_auth_cancelled",
  GoogleEmailUnverified = "google_email_unverified",
  GoogleAccountConflict = "google_account_conflict",
  GoogleAccountNotFound = "google_account_not_found",
}
