"use client";

import { SubmitEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";
import SmartImage from "@/components/shared/SmartImage";
import AuthFormError from "@/components/auth/AuthFormError";
import ArrowRight from "@/assets/icons/arrow-right.svg";
import { cn } from "@/lib/utils";
import { CONVERT_QUERY_KEY } from "@/constants/conversion";
import { FramerUrlFormProps } from "@/types/shared";

const DEFAULT_SITE = "your-site.framer.website";

export default function FramerUrlForm({
  className,
  onSubmit,
  submitHref,
  initialUrl = "",
  isLoading = false,
  error = null,
}: FramerUrlFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);

  const site = url.trim().replace(/^https?:\/\//i, "") || DEFAULT_SITE;

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (submitHref) {
      router.push(trimmed ? `${submitHref}?${CONVERT_QUERY_KEY}=${encodeURIComponent(trimmed)}` : submitHref);
      return;
    }
    if (trimmed) onSubmit?.(trimmed);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={cn("max-w-77.5 w-full mx-auto mt-7.5 mb-5", className)}
      >
        <div className="w-full h-14.75 mb-1 rounded-[7px] bg-white flex items-center justify-center px-2">
          <Input
            autoFocus
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter your Framer website URL"
            aria-label="Framer website URL"
            aria-invalid={Boolean(error)}
            disabled={isLoading}
            className="border-0 outline-none text-center placeholder:text-c8a8a8a"
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading}
          aria-busy={isLoading}
          className="rounded-lg"
          rightIcon={<SmartImage src={ArrowRight} alt="" width={16} height={16} />}
        >
          Get Next.js
        </Button>
      </form>

      <AuthFormError message={error} />

      <p className="px-4 py-0.75 bg-cf7f6f5 rounded-[5px] text-c767676 text-sm w-max max-w-full mx-auto truncate">
        https://<span>{site}</span>
      </p>
    </>
  );
}
