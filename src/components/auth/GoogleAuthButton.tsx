"use client";

import { useEffect, useState } from "react";
import Button from "@/components/shared/Button";
import SmartImage from "@/components/shared/SmartImage";
import GoogleIcon from "@/assets/icons/google.svg";
import { AUTH_QUERY_KEYS, AUTH_ROUTES } from "@/constants/auth";
import { clearRedirectAfterLogin, getRedirectAfterLogin } from "@/utils/auth";
import { GoogleAuthButtonProps } from "@/types/auth";
import { AuthMode } from "@/utils/enum";

// `authPage` brings failures back to this page. `redirectTo` returns the
// user to the page they were on when their session expired; the API rejects
// anything but a relative path.
function getGoogleAuthUrl(mode: AuthMode, marketingOptIn: boolean) {
  const query = new URLSearchParams({ [AUTH_QUERY_KEYS.AUTH_PAGE]: mode });
  // Sign-up is the only page that can create an account; the API requires
  // the terms to be accepted there, and only accepts the opt-in there.
  if (mode === AuthMode.SignUp) {
    query.set(AUTH_QUERY_KEYS.ACCEPT_TERMS, "true");
    query.set(AUTH_QUERY_KEYS.MARKETING_OPT_IN, String(marketingOptIn));
  }

  const redirectTo = getRedirectAfterLogin();
  if (redirectTo) {
    query.set(AUTH_QUERY_KEYS.REDIRECT_TO, redirectTo);
    // Cleared now: the page is about to leave for Google and won't run again.
    clearRedirectAfterLogin();
  }

  return `${AUTH_ROUTES.GOOGLE}?${query}`;
}

export default function GoogleAuthButton({
  text,
  mode,
  termsAccepted,
  marketingOptIn = false,
  onTermsRequired,
}: GoogleAuthButtonProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Pressing Back on Google's screen restores this page from the back/forward
  // cache with the button still disabled, so re-enable it.
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setIsRedirecting(false);
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  const handleClick = () => {
    if (mode === AuthMode.SignUp && !termsAccepted) {
      onTermsRequired?.();
      return;
    }

    setIsRedirecting(true);
    // A full-page navigation, not router.push: the API responds with a
    // redirect to Google and sets the OAuth state cookie.
    window.location.assign(getGoogleAuthUrl(mode, marketingOptIn));
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isRedirecting}
      aria-busy={isRedirecting}
      className="rounded-xl h-10.5 bg-white border border-cdcdce2 text-c16161a"
      leftIcon={<SmartImage src={GoogleIcon} alt="" width={16} height={16} />}
    >
      {text}
    </Button>
  );
}
