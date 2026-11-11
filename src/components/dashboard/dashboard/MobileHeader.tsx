"use client";

import { useEffect, useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import AppLogo from "@/components/shared/AppLogo";
import HamburgerButton from "@/components/dashboard/dashboard/HamburgerButton";
import { MobileHeaderProps } from "@/types/dashboard";

const DESKTOP_QUERY = "(min-width: 48rem)";

export default function MobileHeader({ children }: MobileHeaderProps) {
  const drawerId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return;

    const desktop = window.matchMedia(DESKTOP_QUERY);
    const close = () => setIsOpen(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const handleBreakpoint = (event: MediaQueryListEvent) => {
      if (event.matches) close();
    };

    document.addEventListener("keydown", handleKeyDown);
    desktop.addEventListener("change", handleBreakpoint);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      desktop.removeEventListener("change", handleBreakpoint);
    };
  }, [isOpen]);

  return (
    <div className="md:hidden shrink-0 flex items-center justify-between pt-6">
      <AppLogo />
      <HamburgerButton
        isOpen={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        aria-controls={drawerId}
      />

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              aria-hidden
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-c0a0a0a/40"
            />
            <motion.aside
              key="drawer"
              id={drawerId}
              aria-label="Workspace"
              initial={shouldReduceMotion ? { opacity: 0 } : { x: "-100%" }}
              animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-y-0 left-0 z-40 w-64 max-w-[80vw] overflow-y-auto bg-white px-4 pt-8 shadow-action-menu"
            >
              {children}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
