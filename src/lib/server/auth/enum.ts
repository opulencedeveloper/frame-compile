export enum AuthProvider {
  Email = "email",
  Google = "google",
}

export enum GoogleUserStatus {
  Found = "found",
  NotFound = "not_found",
  // The email already belongs to a different Google account.
  Conflict = "conflict",
}
