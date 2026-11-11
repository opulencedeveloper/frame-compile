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

export enum SiteFilter {
  All = "all",
  Deployed = "deployed",
  NotDeployed = "not-deployed",
}
