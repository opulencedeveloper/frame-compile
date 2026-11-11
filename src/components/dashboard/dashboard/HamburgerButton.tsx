"use client";

import { motion, useReducedMotion } from "framer-motion";
import { HamburgerButtonProps } from "@/types/dashboard";

export default function HamburgerButton({
  isOpen,
  onClick,
  "aria-controls": controls,
}: HamburgerButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const transition = { duration: shouldReduceMotion ? 0 : 0.25, ease: [0.4, 0, 0.2, 1] as const };
  const bar = "block h-0.5 w-5 rounded-full bg-c0a0a0a";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-expanded={isOpen}
      aria-controls={controls}
      className="relative z-50 flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-cf4f4f6"
    >
      <span className="flex h-4 w-5 flex-col justify-between">
        <motion.span
          className={bar}
          animate={isOpen ? { y: 7, rotate: 45 } : { y: 0, rotate: 0 }}
          transition={transition}
        />
        <motion.span
          className={bar}
          animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
          transition={transition}
        />
        <motion.span
          className={bar}
          animate={isOpen ? { y: -7, rotate: -45 } : { y: 0, rotate: 0 }}
          transition={transition}
        />
      </span>
    </button>
  );
}
