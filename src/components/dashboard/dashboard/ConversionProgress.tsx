import { conversionDurationHint, conversionStatusLabels } from "@/resources/dashboard";
import { ConversionProgressProps } from "@/types/conversion";
import { ConversionStatus } from "@/utils/enum";

export default function ConversionProgress({ conversion }: ConversionProgressProps) {
  const isFailed = conversion.status === ConversionStatus.Failed;

  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-3">
      {!isFailed && (
        <span
          aria-hidden
          className="size-8 rounded-full border-3 border-ceaeaee border-t-c0a0a0a animate-spin motion-reduce:animate-none"
        />
      )}
      <p className="text-c0a0a0a font-nunito-500 text-sm truncate max-w-full">{conversion.siteName}</p>
      <p className={isFailed ? "text-cdc2626 font-nunito-400 text-sm" : "text-c767676 font-nunito-400 text-sm"}>
        {isFailed
          ? (conversion.failure?.message ?? conversionStatusLabels[ConversionStatus.Failed])
          : conversionStatusLabels[conversion.status]}
      </p>
      {!isFailed && conversion.status !== ConversionStatus.Ready && (
        <p className="text-c8a8a8a font-nunito-400 text-xs">{conversionDurationHint}</p>
      )}
    </div>
  );
}
