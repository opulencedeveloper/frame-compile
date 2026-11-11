"use client";

import { Suspense, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";
import DropdownInput from "@/components/shared/DropdownInput";
import AuthFormError from "@/components/auth/AuthFormError";
import { useConversions } from "@/hooks/useConversions";
import { conversionListContent, siteFilterOptions } from "@/resources/dashboard";
import { AppDispatch, RootState } from "@/store/redux";
import { conversionsActions } from "@/store/redux/conversions-slice";
import { Conversion } from "@/types/conversion";
import { SiteFilter } from "@/utils/enum";
import ContentCard from "./ContentCard";
import ConvertFromQuery from "./ConvertFromQuery";
import DeleteConversionModal from "./DeleteConversionModal";
import NewConvertButton from "./NewConvertButton";

export default function ConversionsBoard() {
  const dispatch = useDispatch<AppDispatch>();
  const { conversions, hasLoaded, filter, search } = useSelector((state: RootState) => state.conversions);
  const { isLoading, error, hasMore, loadMore } = useConversions();
  const [deleting, setDeleting] = useState<Conversion | null>(null);

  const emptyMessage = !hasLoaded
    ? conversionListContent.loading
    : search.trim()
      ? conversionListContent.noMatches
      : filter === SiteFilter.Deployed
        ? conversionListContent.noDeployed
        : filter === SiteFilter.NotDeployed
          ? conversionListContent.noUndeployed
          : conversionListContent.empty;

  return (
    <>
      <div className="h-max w-full shrink-0 bg-white mt-8 mb-5 flex flex-col min-[822px]:flex-row gap-2 justify-between">
        <div className="flex gap-3 h-8.5 min-[822px]:h-10">
          <Input
            value={search}
            onChange={(event) => dispatch(conversionsActions.setSearch(event.target.value))}
            className="h-full w-full min-[822px]:w-52"
            placeholder="Search sites…"
            aria-label="Search sites"
          />
          <DropdownInput
            className="h-full w-39"
            options={siteFilterOptions}
            value={filter}
            onChange={(value) => dispatch(conversionsActions.setFilter(value as SiteFilter))}
            aria-label="Filter sites"
          />
        </div>

        <NewConvertButton />
      </div>

      <AuthFormError message={error} />

      <div className="flex-1 min-h-0 w-full pb-20 overflow-y-auto scrollbar-hidden">
        {conversions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 content-start gap-x-5 gap-y-6 md:gap-y-8">
            {conversions.map((conversion) => (
              <ContentCard key={conversion.id} conversion={conversion} onDelete={setDeleting} />
            ))}
          </div>
        ) : (
          <p role="status" className="pt-16 text-center text-sm font-nunito-400 text-c767676">
            {emptyMessage}
          </p>
        )}

        {hasMore && (
          <Button
            onClick={loadMore}
            disabled={isLoading}
            aria-busy={isLoading}
            className="rounded-lg max-w-40 mx-auto mt-8 flex bg-cdcdce1 text-c0a0a0a"
          >
            {conversionListContent.loadMore}
          </Button>
        )}
      </div>

      <DeleteConversionModal conversion={deleting} onClose={() => setDeleting(null)} />
      <Suspense fallback={null}>
        <ConvertFromQuery />
      </Suspense>
    </>
  );
}
