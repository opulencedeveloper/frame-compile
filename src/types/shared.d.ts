import { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { ImageProps, StaticImageData } from "next/image";

export interface SmartImageProps extends Omit<ImageProps, "onLoad" | "placeholder"> {
  containerClassName?: string;
  useSkeleton?: boolean;
  preload?: boolean;
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export interface InputIcon {
  src: StaticImageData;
  alt: string;
  width?: number;
  height?: number;
  onClick?: () => void;
}

export interface InputProps extends ComponentProps<"input"> {
  suffixIcon?: InputIcon;
}

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DropdownInputProps {
  options: DropdownOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

// Where a dropdown's list opens, in viewport pixels: under its trigger, at
// least as wide, and kept inside the window. It lines up with the trigger's
// left edge, or its right edge (growing leftwards) when that side has more room.
export interface ListboxPosition {
  top: number;
  left?: number;
  right?: number;
  minWidth: number;
  maxWidth: number;
  maxHeight: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  "aria-labelledby": string;
  className?: string;
}

// Open while message is set; the only way out is retrying.
export interface ErrorModalProps {
  message: string | null;
  onRetry: () => void;
}

// Failed requests shown in the page's one error modal.
export interface RequestErrorsState {
  // Each failed request's message, by the id of the hook that sent it.
  errors: Record<string, string>;
  // Raised by "Try again"; every failed request retries when it changes.
  retryCount: number;
}

export interface AppLogoProps {
  // Where clicking the logo goes; the home page unless given.
  href?: string;
}

export interface ClassNameProps {
  className?: string;
}

export interface FramerUrlFormProps extends ClassNameProps {
  // Called with the trimmed URL.
  onSubmit?: (url: string) => void;
  // Without onSubmit: the page submitting the form goes to, with the URL.
  submitHref?: string;
  // What the field starts with.
  initialUrl?: string;
  isLoading?: boolean;
  error?: string | null;
}

export interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  label: ReactNode;
}

export interface SectionLabelProps {
  title: string;
}

export interface BackLinkProps {
  fallbackHref?: string;
  className?: string;
  children?: ReactNode;
  // Handles Back in place (e.g. a previous step on the same page) instead
  // of navigating.
  onBack?: () => void;
}

export interface ClientProviderProps {
  children: ReactNode;
}
