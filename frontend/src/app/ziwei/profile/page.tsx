import type { Metadata } from "next";
import { ZiweiProfileClient } from "@/components/ziwei/ziwei-profile-client";

export const metadata: Metadata = {
  title: "紫微斗数排盘"
};

export default function ZiweiProfilePage() {
  return <ZiweiProfileClient />;
}
