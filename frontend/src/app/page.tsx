import { Suspense } from "react";
import { MetaphysicsHomeClient } from "@/components/home/metaphysics-home-client";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="app-responsive-shell min-h-screen bg-paper" />}>
      <MetaphysicsHomeClient />
    </Suspense>
  );
}
