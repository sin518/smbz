import type { Metadata } from "next";
import { ZiweiChartClient } from "@/components/ziwei/ziwei-chart-client";

export const metadata: Metadata = {
  title: "紫微斗数命盘"
};

export default function ZiweiPage() {
  return <ZiweiChartClient />;
}
