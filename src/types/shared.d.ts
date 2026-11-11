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

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  "aria-labelledby": string;
  className?: string;
}

export interface ClassNameProps {
  className?: string;
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
