import { Metadata } from "next";
import JsonLd from "@/components/shared/JsonLd";
import LegalDocument from "@/components/shared/LegalDocument";
import { pageJsonLd, pageMetadata } from "@/lib/seo";
import { termsOfService } from "@/resources/legal";
import { pageSeo } from "@/resources/seo";

export const metadata: Metadata = pageMetadata(pageSeo.terms);

export default function TermsOfServicePage() {
  return (
    <>
      <JsonLd data={pageJsonLd(pageSeo.terms, termsOfService.lastUpdated)} />
      <LegalDocument content={termsOfService} />
    </>
  );
}
