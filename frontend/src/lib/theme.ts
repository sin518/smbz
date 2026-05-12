export type ThemeMode = "light" | "dark" | "system";

export const themeStorageKey = "sm1:appearance";

export function resolveStoredTheme(value: string | null): ThemeMode {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

export function applyThemeMode(mode: ThemeMode) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedTheme = mode === "system" ? (prefersDark ? "dark" : "light") : mode;

  document.documentElement.dataset.themeMode = mode;
  document.documentElement.dataset.theme = resolvedTheme;
  document.documentElement.style.colorScheme = resolvedTheme;
}
