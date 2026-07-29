import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "排盘记录"
};

export default function RecordsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
