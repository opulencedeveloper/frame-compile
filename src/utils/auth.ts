import { AUTH_KEYS } from "@/constants/auth";

// The page useHttp saved on a 401, so signing in returns the user there.
// sessionStorage throws when storage is blocked; treat that as "none".
export function getRedirectAfterLogin() {
  try {
    return sessionStorage.getItem(AUTH_KEYS.REDIRECT_AFTER_LOGIN) ?? undefined;
  } catch {
    return undefined;
  }
}

export function clearRedirectAfterLogin() {
  try {
    sessionStorage.removeItem(AUTH_KEYS.REDIRECT_AFTER_LOGIN);
  } catch {
    // Storage is blocked, so there is nothing to clear.
  }
}
