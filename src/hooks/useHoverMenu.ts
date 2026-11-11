import { PointerEvent, useEffect, useRef, useState } from "react";

const HOVER_CLOSE_DELAY_MS = 150;

export const useHoverMenu = ({
  disabled,
  onOpen,
}: { disabled?: boolean; onOpen?: () => void } = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointerTypeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    const closeTimer = closeTimerRef;
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const cancelClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  };

  const open = () => {
    cancelClose();
    if (isOpen || disabled) return;
    onOpen?.();
    setIsOpen(true);
  };

  const close = () => {
    cancelClose();
    setIsOpen(false);
  };

  const rootProps = {
    ref: rootRef,
    onPointerEnter: (event: PointerEvent) => {
      if (event.pointerType === "mouse") open();
    },
    onPointerLeave: (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || !isOpen) return;
      closeTimerRef.current = setTimeout(close, HOVER_CLOSE_DELAY_MS);
    },
  };

  const triggerProps = {
    onPointerDown: (event: PointerEvent) => {
      lastPointerTypeRef.current = event.pointerType;
    },
    onClick: () => {
      if (lastPointerTypeRef.current === "mouse") open();
      else if (isOpen) close();
      else open();
    },
  };

  return { isOpen, open, close, rootProps, triggerProps };
};
