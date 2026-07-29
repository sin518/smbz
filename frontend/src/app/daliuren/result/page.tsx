import type { Metadata } from "next";
import { DaliurenResultClient } from "@/components/daliuren/daliuren-result-client";

export const metadata: Metadata = {
  title: "大六壬结果"
};

export default function DaliurenResultPage() {
  return <DaliurenResultClient />;
}
