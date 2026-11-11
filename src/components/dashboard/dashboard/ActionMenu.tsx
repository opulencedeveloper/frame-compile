"use client";

import { KeyboardEvent, useEffect, useId, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHoverMenu } from "@/hooks/useHoverMenu";
import { ActionMenuProps } from "@/types/dashboard";
import { MenuItemVariant } from "@/utils/enum";

export default function ActionMenu({
  items,
  onSelect,
  "aria-label": ariaLabel,
  children,
  className,
  triggerClassName,
}: ActionMenuProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const pendingFocusRef = useRef<number | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { isOpen, open, close, rootProps, triggerProps } = useHoverMenu();

  useEffect(() => {
    if (!isOpen || pendingFocusRef.current === null) return;
    itemRefs.current[pendingFocusRef.current]?.focus();
    pendingFocusRef.current = null;
  }, [isOpen]);

  const openWithFocus = (index: number) => {
    pendingFocusRef.current = index;
    if (isOpen) itemRefs.current[index]?.focus();
    else open();
  };

  const closeAndReturnFocus = () => {
    close();
    triggerRef.current?.focus();
  };

  const handleSelect = (value: string) => {
    closeAndReturnFocus();
    onSelect?.(value);
  };

  const handleTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openWithFocus(0);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openWithFocus(items.length - 1);
    } else if (event.key === "Escape" && isOpen) {
      event.preventDefault();
      close();
    }
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = itemRefs.current.findIndex((item) => item === document.activeElement);
    const focusItem = (index: number) => itemRefs.current[index]?.focus();

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        focusItem((current + 1) % items.length);
        break;
      case "ArrowUp":
        event.preventDefault();
        focusItem((current - 1 + items.length) % items.length);
        break;
      case "Home":
        event.preventDefault();
        focusItem(0);
        break;
      case "End":
        event.preventDefault();
        focusItem(items.length - 1);
        break;
      case "Escape":
        event.preventDefault();
        closeAndReturnFocus();
        break;
      case "Tab":
        close();
        break;
    }
  };

  return (
    <div {...rootProps} className={cn("relative w-max", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        {...triggerProps}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "inline-flex h-10 shrink-0 items-center justify-center px-4 transition-opacity hover:opacity-90",
          triggerClassName,
        )}
      >
        {children}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={menuId}
            role="menu"
            aria-label={ariaLabel}
            onKeyDown={handleMenuKeyDown}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-full z-20 mt-1 flex w-31 flex-col rounded-xl bg-white p-1 shadow-action-menu"
          >
            {items.map((item, index) => (
              <button
                key={item.value}
                ref={(element) => {
                  itemRefs.current[index] = element;
                }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => handleSelect(item.value)}
                onPointerEnter={(event) => event.currentTarget.focus()}
                className={cn(
                  "flex h-8 w-full items-center rounded-lg px-3 text-left text-sm font-nunito-400 outline-none transition-colors hover:bg-cf4f4f6 focus:bg-cf4f4f6",
                  item.variant === MenuItemVariant.Danger ? "text-cff383c" : "text-c282828",
                )}
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
