"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import SmartImage from "@/components/shared/SmartImage";
import ActionMenu from "@/components/dashboard/dashboard/ActionMenu";
import MoreHortz from "@/assets/icons/more-hortz.svg";
import { conversionListContent, conversionStatusLabels, siteActionItems } from "@/resources/dashboard";
import { ContentCardProps } from "@/types/conversion";
import { isConversionInProgress, timeAgo } from "@/utils/conversion";
import { ConversionStatus, SiteAction } from "@/utils/enum";

export default function ContentCard({ conversion, onDelete }: ContentCardProps) {
  const router = useRouter();
  const href = `/${conversion.id}`;
  const isFailed = conversion.status === ConversionStatus.Failed;

  const handleSelect = (value: string) => {
    if (value === SiteAction.Delete) onDelete(conversion);
    else router.push(href);
  };

  return (
    <div className="w-full">
      <Link
        href={href}
        aria-label={`Open ${conversion.siteName}`}
        className="relative block w-full h-58.5 rounded-xl mb-2.5 border border-ceaeaee overflow-hidden bg-cf7f6f5"
      >
        {conversion.thumbnailUrl ? (
          <SmartImage
            src={conversion.thumbnailUrl}
            alt=""
            fill
            unoptimized
            useSkeleton
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-top"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-nunito-400 text-c767676">
            {isFailed
              ? (conversion.failure?.message ?? conversionStatusLabels[ConversionStatus.Failed])
              : isConversionInProgress(conversion.status)
                ? conversionStatusLabels[conversion.status]
                : conversion.siteName}
          </span>
        )}
      </Link>
      <div className="flex justify-between">
        <div className="space-y-0.5 min-w-0">
          <p className="text-c0a0a0a font-nunito-500 text-sm truncate">{conversion.siteName}</p>
          <p className="text-c666666 text-xs font-nunito-400">
            {conversionListContent.framework} · {timeAgo(conversion.createdAt)}
          </p>
        </div>

        <ActionMenu items={siteActionItems} onSelect={handleSelect} aria-label={`Actions for ${conversion.siteName}`}>
          <SmartImage alt="" height={28} width={32} src={MoreHortz} className="w-9 h-8" />
        </ActionMenu>
      </div>
    </div>
  );
}
