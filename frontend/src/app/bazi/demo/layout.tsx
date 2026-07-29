import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "八字命盘"
};

export default function DemoBaziLayout({
  children,
  modal
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
