"use client";

import { useId } from "react";
import Modal from "@/components/shared/Modal";
import Button from "@/components/shared/Button";
import { errorModalContent } from "@/resources/shared";
import { ErrorModalProps } from "@/types/shared";

const stayOpen = () => {};

export default function ErrorModal({ message, onRetry }: ErrorModalProps) {
  const titleId = useId();

  return (
    <Modal isOpen={message !== null} onClose={stayOpen} aria-labelledby={titleId} className="max-w-100">
      <div className="px-6 pt-8 pb-6 text-center">
        <h2 id={titleId} className="text-c0a0a0a font-hedvig-400-14 text-[22px] leading-7">
          {errorModalContent.title}
        </h2>
        <p role="alert" className="mt-3 text-c767676 font-nunito-400 text-sm">
          {message}
        </p>
        <Button onClick={onRetry} className="mt-6 rounded-lg">
          {errorModalContent.retry}
        </Button>
      </div>
    </Modal>
  );
}
