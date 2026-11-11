"use client";

import { useId } from "react";
import { useDispatch } from "react-redux";
import Modal from "@/components/shared/Modal";
import Button from "@/components/shared/Button";
import AuthFormError from "@/components/auth/AuthFormError";
import { useHttp } from "@/hooks/useHttp";
import { CONVERSION_API } from "@/constants/conversion";
import { deleteConversionContent } from "@/resources/dashboard";
import { AppDispatch } from "@/store/redux";
import { conversionsActions } from "@/store/redux/conversions-slice";
import { DeleteConversionModalProps } from "@/types/conversion";

export default function DeleteConversionModal({ conversion, onClose }: DeleteConversionModalProps) {
  const titleId = useId();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, sendHttpRequest } = useHttp();

  const confirm = () => {
    if (!conversion) return;
    sendHttpRequest({
      requestConfig: { url: CONVERSION_API.DETAIL(conversion.id), method: "DELETE" },
      successRes: () => {
        dispatch(conversionsActions.removeConversion(conversion));
        onClose();
      },
    });
  };

  return (
    <Modal isOpen={conversion !== null} onClose={onClose} aria-labelledby={titleId} className="max-w-100">
      <div className="px-6 pt-8 pb-6 text-center">
        <h2 id={titleId} className="text-c0a0a0a font-hedvig-400-14 text-[22px] leading-7">
          {deleteConversionContent.title}
        </h2>
        <p className="mt-3 text-c767676 font-nunito-400 text-sm">
          <span className="font-nunito-500 text-c0a0a0a">{conversion?.siteName}</span>.{" "}
          {deleteConversionContent.description}
        </p>
        <div className="mt-4">
          <AuthFormError message={error} />
        </div>
        <div className="mt-2 flex gap-3">
          <Button onClick={onClose} className="rounded-lg flex-1 shrink min-w-0 bg-cdcdce1 text-c0a0a0a">
            {deleteConversionContent.cancel}
          </Button>
          <Button onClick={confirm} disabled={isLoading} aria-busy={isLoading} className="rounded-lg flex-1 shrink min-w-0 bg-cdc2626">
            {deleteConversionContent.confirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
