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

// The signed-in user, as /users/me returns them.
export interface UserProfile {
  name: string;
  email: string;
}

export interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface ActionMenuItem {
  label: string;
  value: string;
  variant?: MenuItemVariant;
}

// Where an action menu opens, in viewport pixels: below its button, or
// above it when there's no room below.
export interface MenuPosition {
  top: number;
  right: number;
  opensUp: boolean;
}

export interface ActionMenuProps {
  items: ActionMenuItem[];
  onSelect?: (value: string) => void;
  "aria-label": string;
  children: ReactNode;
  className?: string;
  triggerClassName?: string;
}
