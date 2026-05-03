import { Suspense } from "react";
import { BaziHomeClient } from "@/components/bazi/bazi-home-client";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="mx-auto min-h-screen max-w-[430px] bg-paper" />}>
      <BaziHomeClient />
    </Suspense>
  );
}
