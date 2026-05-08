import { Suspense } from "react";
import { BaziHomeClient } from "@/components/bazi/bazi-home-client";

export default function BaziPage() {
  return (
    <Suspense fallback={<div className="mx-auto min-h-screen max-w-[430px] bg-paper" />}>
      <BaziHomeClient backHref="/" />
    </Suspense>
  );
}
