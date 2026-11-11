"use client";

import { useState } from "react";
import SmartImage from "@/components/shared/SmartImage";
import ArrowUpRight from "@/assets/icons/arrow-up-right.svg";
import { deploymentBarContent, deploymentStatusLabels } from "@/resources/deployment";
import { DeploymentBarProps } from "@/types/deployment";
import { isDeploymentInProgress } from "@/utils/conversion";
import { DeploymentStatus } from "@/utils/enum";

export default function DeploymentBar({ conversion }: DeploymentBarProps) {
  const [isCopied, setIsCopied] = useState(false);
  const deployment = conversion.deployment;
  if (!deployment) return null;

  const copy = async (url: string) => {
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 2000);
  };

  if (deployment.status === DeploymentStatus.Ready && deployment.url) {
    const url = deployment.url;
    return (
      <div className="mt-3 flex items-center gap-2 min-w-0 text-sm font-nunito-400">
        <span aria-hidden className="size-2 shrink-0 rounded-full bg-c16a34a" />
        <span className="shrink-0 text-c767676">{deploymentBarContent.liveAt}</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-w-0 items-center gap-1 font-nunito-500 text-c0a0a0a hover:opacity-70"
        >
          <span className="truncate">{url.replace(/^https:\/\//, "")}</span>
          <SmartImage src={ArrowUpRight} alt="" width={14} height={14} className="shrink-0" />
        </a>
        <button
          type="button"
          onClick={() => copy(url)}
          className="shrink-0 rounded-md bg-cf7f6f5 px-2 py-0.5 text-xs text-c767676 transition-opacity hover:opacity-70"
        >
          <span aria-live="polite">{isCopied ? deploymentBarContent.copied : deploymentBarContent.copy}</span>
        </button>
      </div>
    );
  }

  if (isDeploymentInProgress(conversion)) {
    return (
      <div role="status" className="mt-3 flex items-center gap-2 text-sm font-nunito-400 text-c767676">
        <span
          aria-hidden
          className="size-3.5 shrink-0 rounded-full border-2 border-ceaeaee border-t-c0a0a0a animate-spin motion-reduce:animate-none"
        />
        {deploymentStatusLabels[deployment.status]}
      </div>
    );
  }

  return (
    <p role="alert" className="mt-3 text-sm font-nunito-400 text-cdc2626">
      {deploymentStatusLabels[DeploymentStatus.Failed]}: {deployment.error}
    </p>
  );
}
