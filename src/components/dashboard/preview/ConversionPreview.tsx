"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import BackLink from "@/components/shared/BackLink";
import Button from "@/components/shared/Button";
import AuthFormError from "@/components/auth/AuthFormError";
import ConversionProgress from "@/components/dashboard/dashboard/ConversionProgress";
import DeployButton from "@/components/dashboard/preview/DeployButton";
import DeploymentBar from "@/components/dashboard/preview/DeploymentBar";
import { useConversion } from "@/hooks/useConversion";
import { conversionDownloadUrl } from "@/constants/conversion";
import { ConversionStatus } from "@/utils/enum";

const secondaryActionClassName = "rounded-lg w-full max-w-34.5 bg-cdcdce1 text-c0a0a0a";

export default function ConversionPreview() {
  const { id } = useParams<{ id: string }>();
  const { conversion, load, replace, error } = useConversion();
  const isReady = conversion?.status === ConversionStatus.Ready;

  useEffect(() => {
    load(id);
  }, [id, load]);

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:justify-between">
        <BackLink fallbackHref="/dashboard" className="md:mb-3.5 shrink-0 whitespace-nowrap">
          Back to Dashboard
        </BackLink>

        <div className="flex gap-2 md:gap-4 md:flex-1 md:min-w-0 md:justify-end">
          {isReady ? (
            <a
              href={conversionDownloadUrl(id)}
              download
              className={`inline-flex h-10 text-sm shrink-0 items-center justify-center gap-2 px-4 font-nunito-500 transition-opacity hover:opacity-90 ${secondaryActionClassName}`}
            >
              Download code
            </a>
          ) : (
            <Button disabled className={secondaryActionClassName}>
              Download code
            </Button>
          )}

          <DeployButton conversion={conversion} onDeployStarted={replace} />
        </div>
      </div>

      {conversion && <DeploymentBar conversion={conversion} />}

      <div className="flex-1 min-h-0 mt-4">
        {isReady && conversion.previewUrl ? (
          <iframe
            src={conversion.previewUrl}
            title={`Preview of ${conversion.siteName}`}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            referrerPolicy="no-referrer"
            className="w-full h-full rounded-xl border border-ceaeaee bg-white"
          />
        ) : (
          <div className="w-full h-full rounded-xl border border-ceaeaee flex flex-col items-center justify-center gap-3 px-4 text-center">
            {conversion ? (
              <ConversionProgress conversion={conversion} />
            ) : (
              !error && <p className="text-c767676 font-nunito-400 text-sm">Loading preview…</p>
            )}
            <AuthFormError message={error} />
          </div>
        )}
      </div>
    </>
  );
}
