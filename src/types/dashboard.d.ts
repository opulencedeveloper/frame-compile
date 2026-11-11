import { ReactNode } from "react";
import { MenuItemVariant } from "@/utils/enum";

export interface MobileHeaderProps {
  children: ReactNode;
}

export interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  "aria-controls": string;
}

export interface ActionMenuItem {
  label: string;
  value: string;
  variant?: MenuItemVariant;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  onSelect?: (value: string) => void;
  "aria-label": string;
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
}
