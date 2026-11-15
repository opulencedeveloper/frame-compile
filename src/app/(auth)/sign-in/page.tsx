import { Metadata } from "next";
import AuthFlow from "@/components/auth/AuthFlow";
import JsonLd from "@/components/shared/JsonLd";
import { pageJsonLd, pageMetadata } from "@/lib/seo";
import { pageSeo, siteSeo } from "@/resources/seo";
import { AuthMode } from "@/utils/enum";

// A sign-in form has nothing to rank for; its links are still followed.
export const metadata: Metadata = {
  ...pageMetadata(pageSeo.signIn),
  robots: { index: false, follow: true },
};

export default function SignInPage() {
  return (
    <>
      <JsonLd data={pageJsonLd(pageSeo.signIn, siteSeo.lastUpdated)} />
      <AuthFlow mode={AuthMode.SignIn} />
    </>
  );
}
