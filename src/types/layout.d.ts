import { ReactNode } from "react";

export interface HeaderProps {
  // Replaces the auth link (the landing page's session-aware links).
  actions?: ReactNode;
  authLinkHref?: string;
  authLinkText?: string;
}

export interface FooterLinkItem {
  label: string;
  text: string;
  href: string;
}
