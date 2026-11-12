import { Metadata } from "next";
import LegalDocument from "@/components/shared/LegalDocument";
import { privacyPolicy } from "@/resources/legal";

export const metadata: Metadata = {
  title: privacyPolicy.title,
  description: privacyPolicy.intro,
};

export default function PrivacyPolicyPage() {
  return <LegalDocument content={privacyPolicy} />;
}
