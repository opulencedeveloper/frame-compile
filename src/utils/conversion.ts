import { Conversion } from "@/types/conversion";
import { ConversionStatus, DeploymentStatus } from "@/utils/enum";

const IN_PROGRESS = [ConversionStatus.Queued, ConversionStatus.Capturing, ConversionStatus.Storing];
const DEPLOYING = [DeploymentStatus.Uploading, DeploymentStatus.Building];

export function isConversionInProgress(status: ConversionStatus) {
  return IN_PROGRESS.includes(status);
}

export function isDeploymentInProgress(conversion: Conversion) {
  return conversion.deployment !== null && DEPLOYING.includes(conversion.deployment.status);
}

// Converting or deploying: worth checking on again.
export function isConversionBusy(conversion: Conversion) {
  return isConversionInProgress(conversion.status) || isDeploymentInProgress(conversion);
}

const TIME_UNITS: [seconds: number, suffix: string][] = [
  [60 * 60 * 24 * 365, "y"],
  [60 * 60 * 24 * 30, "mo"],
  [60 * 60 * 24, "d"],
  [60 * 60, "h"],
  [60, "m"],
];

// "10d ago", "3h ago", "just now".
export function timeAgo(date: string, now = Date.now()) {
  const seconds = Math.max(0, (now - new Date(date).getTime()) / 1000);
  for (const [unit, suffix] of TIME_UNITS) {
    if (seconds >= unit) return `${Math.floor(seconds / unit)}${suffix} ago`;
  }
  return "just now";
}
