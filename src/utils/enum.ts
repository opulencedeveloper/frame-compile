export enum AuthMode {
  SignIn = "sign-in",
  SignUp = "sign-up",
}

// field of every API response.
export enum MessageResponse {
  Error = "error",
  Success = "success",
  VerifyEmail = "verify_email",
}

// the API redirects to /sign-in with.
export enum AuthErrorCode {
  GoogleAuthFailed = "google_auth_failed",
  GoogleAuthCancelled = "google_auth_cancelled",
  GoogleEmailUnverified = "google_email_unverified",
  GoogleAccountConflict = "google_account_conflict",
  GoogleAccountNotFound = "google_account_not_found",
}

export enum MenuItemVariant {
  Default = "default",
  Danger = "danger",
}

export enum SiteAction {
  Preview = "preview",
  Deploy = "deploy",
  Delete = "delete",
}

// Mirrors ConversionStatus in src/lib/server/conversion/enum.ts.
export enum ConversionStatus {
  Queued = "queued",
  Capturing = "capturing",
  Storing = "storing",
  Ready = "ready",
  Failed = "failed",
}

export enum SiteFilter {
  All = "all",
  Deployed = "deployed",
  NotDeployed = "not-deployed",
}

// Mirrors DeploymentStatus in src/lib/server/deployment/enum.ts.
export enum DeploymentStatus {
  Uploading = "uploading",
  Building = "building",
  Ready = "ready",
  Failed = "failed",
}

// The steps of the deploy modal.
export enum DeployStep {
  Loading = "loading",
  Token = "token",
  Account = "account",
  Progress = "progress",
}
