import { Suspense } from "react";
import ConversionPreview from "@/components/dashboard/preview/ConversionPreview";

export default function Preview() {
  return (
    <section className="w-full px-4 md:px-6 h-full ">
      <div className="w-full max-w-max-width mx-auto h-full pt-12 pb-6 flex flex-col">
        <Suspense fallback={<div className="w-full flex-1 mt-14.5 rounded-xl border border-ceaeaee" />}>
          <ConversionPreview />
        </Suspense>
      </div>
    </section>
  );
}
