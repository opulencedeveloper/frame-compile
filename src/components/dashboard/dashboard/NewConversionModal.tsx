"use client";

import { useId } from "react";
import Modal from "@/components/shared/Modal";
import ExclusiveBadge from "@/components/shared/ExclusiveBadge";
import FramerUrlForm from "@/components/shared/FramerUrlForm";
import SmartImage from "@/components/shared/SmartImage";
import CloseIcon from "@/assets/icons/close.svg";
import { NewConversionModalProps } from "@/types/dashboard";

export default function NewConversionModal({ isOpen, onClose }: NewConversionModalProps) {
  const titleId = useId();

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-labelledby={titleId} className="max-w-116">
      <button
        type="button"
        onClick={onClose}
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
        <p className="mt-4 text-c767676 font-nunito-400 text-base md:text-[18px]">
          Paste a published framer URL and convert to code
        </p>

        <FramerUrlForm className="max-w-80.5 mt-7 mb-3 p-1.5 rounded-xl bg-cf7f6f5" />
      </div>
    </Modal>
  );
}
