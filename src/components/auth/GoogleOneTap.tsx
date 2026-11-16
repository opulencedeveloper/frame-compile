"use client";

import { useEffect } from "react";
import { useHttp } from "@/hooks/useHttp";
import { AUTH_API, GOOGLE_IDENTITY_SCRIPT } from "@/constants/auth";
import { GoogleCredentialResponse } from "@/types/google";
import { GoogleOneTapSession } from "@/types/auth";

function loadGoogleIdentity(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Identity Services failed to load"));
    document.head.appendChild(script);
  });
}

function whenIdle(task: () => void): () => void {
  let handle = 0;
  const run = () => {
    handle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(task, { timeout: 4000 })
        : window.setTimeout(task, 1500);
  };
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
  return () => {
    window.removeEventListener("load", run);
    if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(handle);
    window.clearTimeout(handle);
  };
}

export default function GoogleOneTap() {
  const { sendHttpRequest } = useHttp();

  useEffect(() => {
    let isActive = true;

    const handleCredential = ({ credential }: GoogleCredentialResponse) => {
      sendHttpRequest({
        requestConfig: { url: AUTH_API.GOOGLE_ONE_TAP, method: "POST", body: { credential } },
        successRes: (res) => window.location.assign(res.data.data.redirectTo as string),
        errorRes: () => false,
      });
    };

    const cancelSchedule = whenIdle(() => {
      sendHttpRequest({
        requestConfig: { url: AUTH_API.GOOGLE_ONE_TAP, method: "GET" },
        successRes: (res) => {
          const { clientId, nonce } = res.data.data as GoogleOneTapSession;
          loadGoogleIdentity()
            .then(() => {
              if (!isActive || !window.google) return;
              window.google.accounts.id.initialize({
                client_id: clientId,
                nonce,
                callback: handleCredential,
                auto_select: false,
                cancel_on_tap_outside: true,
                context: "signin",
                itp_support: true,
                use_fedcm_for_prompt: true,
              });
              window.google.accounts.id.prompt();
            })
            .catch(() => undefined);
        },
        errorRes: () => false,
      });
    });

    return () => {
      isActive = false;
      cancelSchedule();
      window.google?.accounts.id.cancel();
    };
  }, [sendHttpRequest]);

  return null;
}
