import { Metadata } from "next";
import LegalDocument from "@/components/shared/LegalDocument";
import { termsOfService } from "@/resources/legal";

export const metadata: Metadata = {
  title: termsOfService.title,
  description: termsOfService.intro,
};

export default function TermsOfServicePage() {
  return <LegalDocument content={termsOfService} />;
}
