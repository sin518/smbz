import type { Metadata } from "next";
import { LiuyaoShakeClient } from "@/components/liuyao/liuyao-shake-client";

export const metadata: Metadata = {
  title: "六爻摇卦"
};

export default function LiuyaoShakePage() {
  return <LiuyaoShakeClient />;
}
