"use client";

import { FocusEvent, KeyboardEvent, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ModalProps } from "@/types/shared";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const subscribe = () => () => {};

export default function Modal({
  isOpen,
  onClose,
  children,
  "aria-labelledby": labelledBy,
  className,
}: ModalProps) {
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    const active = document.activeElement;
    if (panel && !panel.contains(active)) {
      if (active instanceof HTMLElement) returnFocusRef.current = active;
      panel.focus();
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusRef.current?.focus();
      returnFocusRef.current = null;
    };
  }, [isOpen]);

  const rememberReturnFocus = (event: FocusEvent<HTMLDivElement>) => {
    const from = event.relatedTarget;
    if (!returnFocusRef.current && from instanceof HTMLElement && !event.currentTarget.contains(from)) {
      returnFocusRef.current = from;
    }
  };

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab" || !panelRef.current) return;

    const focusable = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  if (!isClient) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose();
          }}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-c0a0a0a/70 p-4"
        >
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            onKeyDown={trapFocus}
            onFocus={rememberReturnFocus}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={cn("relative w-full rounded-[30px] bg-white outline-none", className)}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
