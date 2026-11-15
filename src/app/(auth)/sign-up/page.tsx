import { Metadata } from "next";
import AuthFlow from "@/components/auth/AuthFlow";
import JsonLd from "@/components/shared/JsonLd";
import { pageJsonLd, pageMetadata } from "@/lib/seo";
import { pageSeo, siteSeo } from "@/resources/seo";
import { AuthMode } from "@/utils/enum";

export const metadata: Metadata = pageMetadata(pageSeo.signUp);

export default function SignUpPage() {
  return (
    <>
      <JsonLd data={pageJsonLd(pageSeo.signUp, siteSeo.lastUpdated)} />
      <AuthFlow mode={AuthMode.SignUp} />
    </>
  );
}
