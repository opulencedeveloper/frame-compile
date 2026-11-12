"use client";

import { useId } from "react";
import Modal from "@/components/shared/Modal";
import Button from "@/components/shared/Button";
import AuthFormError from "@/components/auth/AuthFormError";
import { useHttp } from "@/hooks/useHttp";
import { AUTH_API, SIGN_IN_ROUTE } from "@/constants/auth";
import { logoutContent } from "@/resources/dashboard";
import { LogoutModalProps } from "@/types/dashboard";

export default function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const titleId = useId();
  const { isLoading, error, sendHttpRequest } = useHttp();

  const confirm = () => {
    sendHttpRequest({
      requestConfig: { url: AUTH_API.LOGOUT, method: "POST" },
      successRes: () => window.location.replace(SIGN_IN_ROUTE),
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-labelledby={titleId} className="max-w-100">
      <div className="px-6 pt-8 pb-6 text-center">
        <h2 id={titleId} className="text-c0a0a0a font-hedvig-400-14 text-[22px] leading-7">
          {logoutContent.title}
        </h2>
        <p className="mt-3 text-c767676 font-nunito-400 text-sm">{logoutContent.description}</p>
        <div className="mt-4">
          <AuthFormError message={error} />
        </div>
        <div className="mt-2 flex gap-3">
          <Button onClick={onClose} className="rounded-lg flex-1 shrink min-w-0 bg-cdcdce1 text-c0a0a0a">
            {logoutContent.cancel}
          </Button>
          <Button onClick={confirm} disabled={isLoading} aria-busy={isLoading} className="rounded-lg flex-1 shrink min-w-0">
            {logoutContent.confirm}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
