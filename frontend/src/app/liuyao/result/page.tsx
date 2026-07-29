import type { Metadata } from "next";
import { LiuyaoResultClient } from "@/components/liuyao/liuyao-result-client";

export const metadata: Metadata = {
  title: "六爻排盘结果"
};

export default function LiuyaoResultPage() {
  return <LiuyaoResultClient />;
}
