"use client";

import { useState } from "react";
import Button from "@/components/shared/Button";
import DeployModal from "@/components/dashboard/preview/DeployModal";
import { DeployButtonProps } from "@/types/deployment";
import { isDeploymentInProgress } from "@/utils/conversion";
import { ConversionStatus, DeploymentStatus } from "@/utils/enum";

export default function DeployButton({ conversion, onDeployStarted }: DeployButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isReady = conversion?.status === ConversionStatus.Ready;

  const label = !conversion?.deployment
    ? "Deploy"
    : isDeploymentInProgress(conversion)
      ? "Deploying…"
      : conversion.deployment.status === DeploymentStatus.Ready
        ? "Deployed"
        : "Deploy";

  return (
    <>
      <Button
        aria-haspopup="dialog"
        disabled={!isReady}
        onClick={() => setIsOpen(true)}
        className="rounded-lg w-full max-w-34.5"
      >
        {label}
      </Button>
      {conversion && isReady && (
        <DeployModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          conversion={conversion}
          onDeployStarted={onDeployStarted}
        />
      )}
    </>
  );
}
