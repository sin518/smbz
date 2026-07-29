import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "八字命盘"
};

export default function LocalBaziLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
