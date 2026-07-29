import type { Metadata } from "next";
import { Suspense } from "react";
import { BaziHomeClient } from "@/components/bazi/bazi-home-client";

export default function BaziPage() {
  return (
    <Suspense fallback={<div className="app-responsive-shell min-h-screen bg-paper" />}>
      <BaziHomeClient backHref="/" />
    </Suspense>
  );
}
export const metadata: Metadata = {
  title: "八字排盘"
};
