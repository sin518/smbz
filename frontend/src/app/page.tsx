import type { Metadata } from "next";
import { Suspense } from "react";
import { MetaphysicsHomeClient } from "@/components/home/metaphysics-home-client";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="app-responsive-shell min-h-screen bg-paper" />}>
      <MetaphysicsHomeClient />
    </Suspense>
  );
}
export const metadata: Metadata = {
  title: {
    absolute: "首页｜赛博排盘"
  }
};
