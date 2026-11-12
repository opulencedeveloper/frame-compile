"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHoverMenu } from "@/hooks/useHoverMenu";
import { useIsClient } from "@/hooks/useIsClient";
import SmartImage from "@/components/shared/SmartImage";
import DropDownIcon from "@/assets/icons/drop-down.svg";
import { DropdownInputProps, ListboxPosition } from "@/types/shared";

const LISTBOX_GAP = 6;
const LISTBOX_MAX_HEIGHT = 240;
const VIEWPORT_MARGIN = 8;

export default function DropdownInput({
  options,
  value,
  defaultValue,
  onChange,
  name,
  placeholder = "Select…",
  disabled,
  className,
  "aria-label": ariaLabel,
}: DropdownInputProps) {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isClient = useIsClient();

  const [internalValue, setInternalValue] = useState(defaultValue);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<ListboxPosition>({ top: 0, left: 0, minWidth: 0, maxWidth: 0, maxHeight: 0 });

  const selectedValue = value ?? internalValue;
  const selectedIndex = options.findIndex((option) => option.value === selectedValue);
  const selectedOption = options[selectedIndex];

  const placeListbox = () => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    if (!trigger) return;
    const top = trigger.bottom + LISTBOX_GAP;
    const spaceRight = window.innerWidth - trigger.left - VIEWPORT_MARGIN;
    const spaceLeft = trigger.right - VIEWPORT_MARGIN;
    const growsLeft = spaceLeft > spaceRight;
    setPosition({
      top,
      ...(growsLeft ? { right: window.innerWidth - trigger.right } : { left: trigger.left }),
      minWidth: trigger.width,
      maxWidth: Math.max(spaceLeft, spaceRight),
      maxHeight: Math.min(LISTBOX_MAX_HEIGHT, window.innerHeight - top - VIEWPORT_MARGIN),
    });
  };

  const {
    isOpen,
    open,
    close,
    rootProps,
    triggerProps,
    menuRef: listboxRef,
  } = useHoverMenu<HTMLUListElement>({
    disabled,
    onOpen: () => {
      placeListbox();
      setActiveIndex(Math.max(selectedIndex, 0));
    },
  });

  useEffect(() => {
    if (!isOpen || activeIndex < 0) return;
    listboxRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [isOpen, activeIndex, listboxRef]);

  const select = (index: number) => {
    const option = options[index];
    close();
    if (!option || option.value === selectedValue) return;
    if (value === undefined) setInternalValue(option.value);
    onChange?.(option.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!isOpen) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        open();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, options.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        select(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        close();
        break;
    }
  };

  return (
    <div {...rootProps} className={cn("relative h-10 w-full", className)}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        disabled={disabled}
        {...triggerProps}
        onKeyDown={handleKeyDown}
        className={cn(
          "flex h-full w-full items-center justify-between gap-2 rounded-md border border-cdcdce1 bg-white pl-3 pr-3 font-nunito-400 text-sm outline-none transition-colors cursor-pointer focus:border-c0081d8 disabled:cursor-not-allowed disabled:opacity-50",
          isOpen && "border-c0081d8",
          selectedOption ? "text-c0a0a0a" : "text-c8a8a8a",
        )}
      >
        <span className="truncate">{selectedOption?.label ?? placeholder}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: "easeOut" }}
          className="flex shrink-0"
        >
          <SmartImage src={DropDownIcon} alt="" width={16} height={16} />
        </motion.span>
      </button>

      {name && <input type="hidden" name={name} value={selectedValue ?? ""} />}

      {isClient &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.ul
                ref={listboxRef}
                id={listboxId}
                role="listbox"
                aria-label={ariaLabel}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                style={{ ...position, transformOrigin: position.right === undefined ? "top left" : "top right" }}
                className="fixed z-30 w-max overflow-y-auto rounded-lg border border-cdcdce1 bg-white p-1 shadow-[0_8px_24px_rgba(10,10,10,0.08)]"
              >
                {options.map((option, index) => {
                  const isSelected = option.value === selectedValue;
                  return (
                    <li
                      key={option.value}
                      id={optionId(index)}
                      role="option"
                      aria-selected={isSelected}
                      onPointerDown={(event) => event.preventDefault()}
                      onPointerEnter={() => setActiveIndex(index)}
                      onClick={() => select(index)}
                      className={cn(
                        "flex h-8.5 cursor-pointer items-center rounded-md px-2.5 text-sm whitespace-nowrap transition-colors",
                        index === activeIndex && "bg-cf4f4f6",
                        isSelected ? "font-nunito-500 text-c0a0a0a" : "font-nunito-400 text-c0a0a0a80",
                      )}
                    >
                      {option.label}
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
