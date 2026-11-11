import { Suspense } from "react";
import type { Metadata } from "next";
import Unsubscribe from "@/components/marketing/Unsubscribe";

export const metadata: Metadata = {
  title: "Unsubscribe",
  // Links carry a personal token; keep them out of search results.
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  // useSearchParams needs a Suspense boundary to render the rest statically.
  return (
    <Suspense fallback={null}>
      <Unsubscribe />
    </Suspense>
  );
}
