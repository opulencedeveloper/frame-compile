"use client";

import { SubmitEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Button from "@/components/shared/Button";
import SectionLabel from "@/components/shared/SectionLabel";
import AuthFormError from "@/components/auth/AuthFormError";
import { useHttp } from "@/hooks/useHttp";
import { MARKETING_API, MARKETING_QUERY_KEYS } from "@/constants/marketing";
import { unsubscribeContent as content } from "@/resources/marketing";

// Asks before unsubscribing rather than doing it on load: link scanners and
// mail previews open URLs, and must not unsubscribe anyone.
export default function Unsubscribe() {
  const token = useSearchParams().get(MARKETING_QUERY_KEYS.TOKEN);
  const [isUnsubscribed, setIsUnsubscribed] = useState(false);
  const { isLoading, error, sendHttpRequest } = useHttp();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;

    sendHttpRequest({
      requestConfig: {
        url: MARKETING_API.UNSUBSCRIBE,
        method: "POST",
        params: { [MARKETING_QUERY_KEYS.TOKEN]: token },
      },
      successRes: () => setIsUnsubscribed(true),
    });
  };

  return (
    <section className="px-4 md:px-18 w-full">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-115 mx-auto mt-0 mb-20 md:my-10.25 md:bg-white md:border md:border-ceaeaee md:rounded-[18px] md:p-8.5"
      >
        <SectionLabel title={content.label} />
        <h1 className="leading-[33.48px] text-c0a0a0a font-hedvig-400-18 text-[24px] md:text-[28px] mt-3.25">
          {isUnsubscribed ? content.successTitle : content.title}
        </h1>
        <p className="text-sm text-c63636d font-nunito-400 mt-2.5 mb-6.25">
          {isUnsubscribed ? content.successDescription : content.description}
        </p>

        {isUnsubscribed ? (
          <Link href="/" className="text-sm font-nunito-500 border-b border-c16161a">
            {content.homeLinkText}
          </Link>
        ) : (
          <>
            <AuthFormError message={token ? error : content.invalidLinkMessage} />
            <Button
              type="submit"
              disabled={!token || isLoading}
              aria-busy={isLoading}
              className="rounded-lg"
            >
              {content.submitButtonText}
            </Button>
          </>
        )}
      </form>
    </section>
  );
}
