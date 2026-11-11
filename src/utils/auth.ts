import { AUTH_KEYS, AUTH_QUERY_KEYS } from "@/constants/auth";

// The page useHttp saved on a 401, so signing in returns the user there.
// sessionStorage throws when storage is blocked; treat that as "none".
export function getRedirectAfterLogin() {
  try {
    return sessionStorage.getItem(AUTH_KEYS.REDIRECT_AFTER_LOGIN) ?? undefined;
  } catch {
    return undefined;
  }
}

// A destination given in the URL ("/sign-in?redirectTo=/dashboard"), as the
// proxy sends signed-out visitors here. Saved like a 401's, so switching to
// sign-up or signing in with Google keeps it. Only same-site paths; the
// server checks again before redirecting.
export function rememberRedirectFromQuery() {
  const redirectTo = new URLSearchParams(window.location.search).get(AUTH_QUERY_KEYS.REDIRECT_TO);
  if (!redirectTo || !redirectTo.startsWith("/") || redirectTo.startsWith("//")) return;
  try {
    sessionStorage.setItem(AUTH_KEYS.REDIRECT_AFTER_LOGIN, redirectTo);
  } catch {
    // Storage is blocked; signing in goes to the default page.
  }
}

export function clearRedirectAfterLogin() {
  try {
    sessionStorage.removeItem(AUTH_KEYS.REDIRECT_AFTER_LOGIN);
  } catch {
    // Storage is blocked, so there is nothing to clear.
  }
}
