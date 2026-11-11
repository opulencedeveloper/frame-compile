"use client";

import { SubmitEvent, useEffect, useId, useState } from "react";
import Modal from "@/components/shared/Modal";
import Button from "@/components/shared/Button";
import Input from "@/components/shared/Input";
import ExclusiveBadge from "@/components/shared/ExclusiveBadge";
import SmartImage from "@/components/shared/SmartImage";
import AuthFormError from "@/components/auth/AuthFormError";
import CloseIcon from "@/assets/icons/close.svg";
import ArrowRight from "@/assets/icons/arrow-right.svg";
import VercelLogo from "@/assets/icons/logos_vercel.svg";
import { useHttp } from "@/hooks/useHttp";
import { DEPLOYMENT_API, VERCEL_TOKEN_URL } from "@/constants/deployment";
import { deployModalContent, deploymentStatusLabels } from "@/resources/deployment";
import { cn } from "@/lib/utils";
import { Conversion } from "@/types/conversion";
import { DeployModalProps, VercelConnection } from "@/types/deployment";
import { isDeploymentInProgress } from "@/utils/conversion";
import { DeploymentStatus, DeployStep } from "@/utils/enum";

export default function DeployModal({ isOpen, onClose, conversion, onDeployStarted }: DeployModalProps) {
  const titleId = useId();
  const connectionRequest = useHttp();
  const deployRequest = useHttp();
  const [connection, setConnection] = useState<VercelConnection | null | undefined>(undefined);
  const [wantsNewToken, setWantsNewToken] = useState(false);
  const [isChoosingAgain, setIsChoosingAgain] = useState(false);
  const [token, setToken] = useState("");
  const [teamId, setTeamId] = useState<string | null>(null);

  const { sendHttpRequest: sendConnection } = connectionRequest;
  const hasDeployment = conversion.deployment !== null;
  const showsProgress = hasDeployment && !isChoosingAgain;

  const step = showsProgress
    ? DeployStep.Progress
    : connection === undefined
      ? DeployStep.Loading
      : connection === null || wantsNewToken
        ? DeployStep.Token
        : DeployStep.Account;

  useEffect(() => {
    if (!isOpen || showsProgress || connection !== undefined) return;
    sendConnection({
      requestConfig: { url: DEPLOYMENT_API.VERCEL, method: "GET" },
      successRes: (res) => setConnection(res.data.data as VercelConnection | null),
    });
  }, [isOpen, showsProgress, connection, sendConnection]);

  const checkToken = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    sendConnection({
      requestConfig: { url: DEPLOYMENT_API.VERCEL, method: "POST", body: { token: token.trim() } },
      successRes: (res) => {
        setToken("");
        setConnection(res.data.data as VercelConnection);
        setTeamId(null);
        setWantsNewToken(false);
      },
    });
  };

  const deploy = () => {
    deployRequest.sendHttpRequest({
      requestConfig: { url: DEPLOYMENT_API.DEPLOY(conversion.id), method: "POST", body: { teamId } },
      successRes: (res) => {
        onDeployStarted(res.data.data as Conversion);
        setIsChoosingAgain(false);
      },
    });
  };

  const deployment = conversion.deployment;
  const title =
    step === DeployStep.Token
      ? deployModalContent.connectTitle
      : step === DeployStep.Account
        ? deployModalContent.accountTitle
        : deployment?.status === DeploymentStatus.Ready
          ? deployModalContent.liveTitle
          : deployment?.status === DeploymentStatus.Failed
            ? deployModalContent.failedTitle
            : deployModalContent.deployingTitle;

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-labelledby={titleId} className="max-w-140">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-6 right-7 flex transition-opacity hover:opacity-70"
      >
        <SmartImage src={CloseIcon} alt="" width={24} height={24} />
      </button>

      <div className="px-5 md:px-10 pt-14 pb-8 text-center">
        <SmartImage src={VercelLogo} alt="Vercel" width={108} height={23} className="mx-auto" />

        <div className="mt-7 flex items-center gap-2">
          <span className="h-px flex-1 bg-ceaeaee" />
          <ExclusiveBadge />
          <span className="h-px flex-1 bg-ceaeaee" />
        </div>

        <h2 id={titleId} className="mt-6 text-c0a0a0a font-hedvig-400-14 text-[26px] md:text-[32px] leading-10">
          {title}
        </h2>

        {step === DeployStep.Loading && (
          <div className="mt-6 mb-2">
            {connectionRequest.error ? (
              <AuthFormError message={connectionRequest.error} />
            ) : (
              <p role="status" className="text-c767676 font-nunito-400 text-sm">
                {deployModalContent.checkingConnection}
              </p>
            )}
          </div>
        )}

        {step === DeployStep.Token && (
          <>
            <p className="mt-4 text-c767676 font-nunito-400 text-base md:text-[18px]">
              {deployModalContent.connectDescription}
            </p>

            <form onSubmit={checkToken} className="mt-7 p-1.5 rounded-xl bg-cf7f6f5">
              <div className="w-full h-14.75 mb-1 rounded-[7px] bg-white flex items-center justify-center px-2">
                <Input
                  autoFocus
                  type="password"
                  autoComplete="off"
                  spellCheck={false}
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder={deployModalContent.tokenPlaceholder}
                  aria-label="Vercel token"
                  disabled={connectionRequest.isLoading}
                  className="border-0 outline-none text-center placeholder:text-c8a8a8a"
                />
              </div>
              <Button
                type="submit"
                disabled={connectionRequest.isLoading}
                aria-busy={connectionRequest.isLoading}
                className="rounded-lg"
                rightIcon={<SmartImage src={ArrowRight} alt="" width={16} height={16} />}
              >
                {deployModalContent.checkToken}
              </Button>
            </form>

            <div className="mt-3">
              <AuthFormError message={connectionRequest.error} />
            </div>

            <p className="mt-2 px-6 py-4 rounded-xl bg-cf7f6f5 text-c767676 font-nunito-400 text-sm leading-6">
              {deployModalContent.tokenHelp}
            </p>

            <a
              href={VERCEL_TOKEN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-c6155f5 font-nunito-500 text-sm hover:opacity-80"
            >
              {deployModalContent.createToken}
              <span aria-hidden>→</span>
            </a>

            <p className="mt-5 px-4 py-2.5 rounded-xl bg-ce9f5ff text-c0081d8 font-nunito-400 text-sm">
              {deployModalContent.tokenNotice}
            </p>
          </>
        )}

        {step === DeployStep.Account && connection && (
          <>
            <p className="mt-4 text-c767676 font-nunito-400 text-base">
              {deployModalContent.accountDescription(connection.username)}
            </p>

            <div role="radiogroup" aria-label="Vercel account" className="mt-6 flex flex-col gap-2 text-left">
              {connection.accounts.map((account) => {
                const isSelected = account.teamId === teamId;
                return (
                  <button
                    key={account.teamId ?? "personal"}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setTeamId(account.teamId)}
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-4 py-3 transition-colors",
                      isSelected ? "border-c0a0a0a bg-cf7f6f5" : "border-ceaeaee hover:bg-cf7f6f5",
                    )}
                  >
                    <span className="text-c0a0a0a font-nunito-500 text-sm truncate">{account.name}</span>
                    <span className="text-c767676 font-nunito-400 text-xs shrink-0 ml-3">
                      {account.isPersonal ? deployModalContent.personalAccount : deployModalContent.team}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3">
              <AuthFormError message={deployRequest.error} />
            </div>

            <Button
              onClick={deploy}
              disabled={deployRequest.isLoading}
              aria-busy={deployRequest.isLoading}
              className="mt-2 rounded-lg"
              rightIcon={<SmartImage src={ArrowRight} alt="" width={16} height={16} />}
            >
              {deployModalContent.deploy}
            </Button>

            <button
              type="button"
              onClick={() => setWantsNewToken(true)}
              className="mt-5 text-c6155f5 font-nunito-500 text-sm hover:opacity-80"
            >
              {deployModalContent.differentToken}
            </button>
          </>
        )}

        {step === DeployStep.Progress && deployment && (
          <div role="status" aria-live="polite" className="mt-6 flex flex-col items-center gap-3">
            {isDeploymentInProgress(conversion) && (
              <>
                <span
                  aria-hidden
                  className="size-8 rounded-full border-3 border-ceaeaee border-t-c0a0a0a animate-spin motion-reduce:animate-none"
                />
                <p className="text-c767676 font-nunito-400 text-sm">{deploymentStatusLabels[deployment.status]}</p>
                <p className="text-c8a8a8a font-nunito-400 text-xs">{deployModalContent.durationHint}</p>
              </>
            )}

            {deployment.status === DeploymentStatus.Ready && deployment.url && (
              <>
                <a
                  href={deployment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-c6155f5 font-nunito-500 text-sm break-all hover:opacity-80"
                >
                  {deployment.url.replace(/^https:\/\//, "")}
                </a>
                <div className="mt-3 flex w-full gap-3">
                  <Button onClick={() => setIsChoosingAgain(true)} className="rounded-lg flex-1 shrink min-w-0 bg-cdcdce1 text-c0a0a0a">
                    {deployModalContent.deployAgain}
                  </Button>
                  <a
                    href={deployment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 flex-1 min-w-0 items-center justify-center rounded-lg bg-c0a0a0a px-4 text-sm font-nunito-500 text-ceff6ff transition-opacity hover:opacity-90"
                  >
                    {deployModalContent.visitSite}
                  </a>
                </div>
              </>
            )}

            {deployment.status === DeploymentStatus.Failed && (
              <>
                <p className="text-cdc2626 font-nunito-400 text-sm">{deployment.error}</p>
                <Button onClick={() => setIsChoosingAgain(true)} className="mt-3 rounded-lg max-w-40">
                  {deployModalContent.tryAgain}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
