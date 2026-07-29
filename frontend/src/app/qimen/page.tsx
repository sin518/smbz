import type { Metadata } from "next";
import { QimenHomeClient } from "@/components/qimen/qimen-home-client";

export const metadata: Metadata = {
  title: "奇门遁甲排盘"
};

export default function QimenPage() {
  return <QimenHomeClient />;
}
