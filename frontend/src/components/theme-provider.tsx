"use client";

import { useEffect } from "react";
import { applyThemeMode, resolveStoredTheme, themeStorageKey } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const syncTheme = () => {
      applyThemeMode(resolveStoredTheme(window.localStorage.getItem(themeStorageKey)));
    };

    syncTheme();
    mediaQuery.addEventListener("change", syncTheme);

    window.addEventListener("storage", syncTheme);

    return () => {
      mediaQuery.removeEventListener("change", syncTheme);
      window.removeEventListener("storage", syncTheme);
    };
  }, []);

  return children;
}
