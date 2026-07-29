import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "页面不存在"
};

export default function GanzhiPage() {
  notFound();
}
