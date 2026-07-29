import type { Metadata } from "next";
import { DaliurenHomeClient } from "@/components/daliuren/daliuren-home-client";

export const metadata: Metadata = {
  title: "大六壬排盘"
};

export default function DaliurenPage() {
  return <DaliurenHomeClient />;
}
