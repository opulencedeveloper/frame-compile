"use client";

import { useCallback, useEffect, useId } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import Modal from "@/components/shared/Modal";
import Button from "@/components/shared/Button";
import ExclusiveBadge from "@/components/shared/ExclusiveBadge";
import FramerUrlForm from "@/components/shared/FramerUrlForm";
import SmartImage from "@/components/shared/SmartImage";
import AuthFormError from "@/components/auth/AuthFormError";
import ConversionProgress from "@/components/dashboard/dashboard/ConversionProgress";
import CloseIcon from "@/assets/icons/close.svg";
import { useConversion } from "@/hooks/useConversion";
import { AppDispatch, RootState } from "@/store/redux";
import { conversionsActions } from "@/store/redux/conversions-slice";
import { ConversionStatus } from "@/utils/enum";

export default function NewConversionModal() {
  const titleId = useId();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isOpen, url } = useSelector((state: RootState) => state.conversions.newConversion);
  const { conversion, start, load, reset, isStarting, error } = useConversion();

  const close = useCallback(() => {
    reset();
    dispatch(conversionsActions.closeNewConversion());
  }, [dispatch, reset]);

  useEffect(() => {
    if (conversion?.status !== ConversionStatus.Ready) return;
    close();
    router.push(`/${conversion.id}`);
  }, [close, conversion, router]);

  return (
    <Modal isOpen={isOpen} onClose={close} aria-labelledby={titleId} className="max-w-116">
      <button
        type="button"
        onClick={close}
        aria-label="Close"
        className="absolute top-6 right-7 flex transition-opacity hover:opacity-70"
      >
        <SmartImage src={CloseIcon} alt="" width={24} height={24} />
      </button>

      <div className="px-5 pt-19 pb-8 text-center">
        <div className="flex items-center gap-2">
          <span className="h-px flex-1 bg-ceaeaee" />
          <ExclusiveBadge />
          <span className="h-px flex-1 bg-ceaeaee" />
        </div>

        <h2
          id={titleId}
          className="mt-6 text-c0a0a0a font-hedvig-400-14 text-[26px] leading-8"
        >
          New conversion
        </h2>

        {conversion ? (
          <div className="mt-7 mb-3 flex flex-col items-center gap-5">
            <ConversionProgress conversion={conversion} />
            <AuthFormError message={error} />
            {conversion.status === ConversionStatus.Failed && (
              <Button onClick={reset} className="rounded-lg max-w-40">
                Try again
              </Button>
            )}
            {error && conversion.status !== ConversionStatus.Failed && (
              <Button onClick={() => load(conversion.id)} className="rounded-lg max-w-40">
                Check again
              </Button>
            )}
          </div>
        ) : (
          <>
            <p className="mt-4 text-c767676 font-nunito-400 text-base md:text-[18px]">
              Paste a published framer URL and convert to code
            </p>

            <FramerUrlForm
              initialUrl={url}
              onSubmit={start}
              isLoading={isStarting}
              error={error}
              className="max-w-80.5 mt-7 mb-3 p-1.5 rounded-xl bg-cf7f6f5"
            />
          </>
        )}
      </div>
    </Modal>
  );
}
