import { FooterLinkItem } from "@/types/layout";
import { LEGAL_ROUTES } from "@/constants/legal";

export const footerLinks: FooterLinkItem[] = [
  {
    label: "Contact",
    text: "covert2code@gmail.com",
    href: "mailto:covert2code@gmail.com",
  },
  {
    label: "Last updated: July 2026",
    text: "Terms of Services",
    href: LEGAL_ROUTES.TERMS,
  },
  {
    label: "Legal",
    text: "Privacy Policy",
    href: LEGAL_ROUTES.PRIVACY,
  },
];
