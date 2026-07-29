import type { Metadata } from "next";
import { QimenChartResult } from "@/components/qimen/qimen-chart-result";

export const metadata: Metadata = {
  title: "奇门遁甲结果"
};

export default function QimenResultPage() {
  return <QimenChartResult />;
}
