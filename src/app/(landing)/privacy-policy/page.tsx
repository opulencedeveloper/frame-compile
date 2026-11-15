import { Metadata } from "next";
import JsonLd from "@/components/shared/JsonLd";
import LegalDocument from "@/components/shared/LegalDocument";
import { pageJsonLd, pageMetadata } from "@/lib/seo";
import { privacyPolicy } from "@/resources/legal";
import { pageSeo } from "@/resources/seo";

export const metadata: Metadata = pageMetadata(pageSeo.privacy);

export default function PrivacyPolicyPage() {
  return (
    <>
      <JsonLd data={pageJsonLd(pageSeo.privacy, privacyPolicy.lastUpdated)} />
      <LegalDocument content={privacyPolicy} />
    </>
  );
}
