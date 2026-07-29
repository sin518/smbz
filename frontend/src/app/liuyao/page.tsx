import type { Metadata } from "next";
import { LiuyaoHomeClient } from "@/components/liuyao/liuyao-home-client";

export const metadata: Metadata = {
  title: "六爻排盘"
};

export default function LiuyaoPage() {
  return <LiuyaoHomeClient />;
}
