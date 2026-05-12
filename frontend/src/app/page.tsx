import { Suspense } from "react";
import { MetaphysicsHomeClient } from "@/components/home/metaphysics-home-client";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="mx-auto min-h-screen max-w-[430px] bg-paper" />}>
      <MetaphysicsHomeClient />
    </Suspense>
  );
}
