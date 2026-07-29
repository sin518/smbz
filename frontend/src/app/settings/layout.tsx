import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "设置"
};

export default function SettingsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
