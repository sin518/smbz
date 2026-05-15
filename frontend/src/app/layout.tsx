import type { Metadata, Viewport } from "next";
import { BaziRecordSyncProvider } from "@/components/bazi/bazi-record-sync-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { themeStorageKey } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "赛博八字",
  description: "八字排盘与 AI 分析初版"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(() => {
  try {
    const stored = window.localStorage.getItem("${themeStorageKey}");
    const mode = stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
    const resolved = mode === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;
    document.documentElement.dataset.themeMode = mode;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
  } catch {
    document.documentElement.dataset.themeMode = "system";
  }
})();
`
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <BaziRecordSyncProvider />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
