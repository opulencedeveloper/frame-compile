import { PointerEvent, useEffect, useRef, useState } from "react";

const HOVER_CLOSE_DELAY_MS = 150;

// The menu is rendered in a portal, fixed to where its trigger was when it
// opened, so it isn't clipped by scrolling containers. It closes when the
// page scrolls or resizes, rather than float away from the trigger.
export const useHoverMenu = <M extends HTMLElement = HTMLDivElement>({
  disabled,
  onOpen,
}: { disabled?: boolean; onOpen?: () => void } = {}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  // The portaled menu: clicks and scrolls in it count as inside.
  const menuRef = useRef<M>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointerTypeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const isInside = (target: EventTarget | null) =>
      target instanceof Node && (rootRef.current?.contains(target) || menuRef.current?.contains(target));
    const handlePointerDown = (event: globalThis.PointerEvent) => {
      if (!isInside(event.target)) setIsOpen(false);
    };
    const handleScroll = (event: Event) => {
      if (!isInside(event.target)) setIsOpen(false);
    };
    const handleResize = () => setIsOpen(false);

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
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

  return { isOpen, open, close, rootProps, triggerProps, menuRef };
};
