import { Suspense } from "react";
import ThankYouPageClient from "./thank-you-page-client";

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouPageClient />
    </Suspense>
  );
}
