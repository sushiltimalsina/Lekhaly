"use client";

import * as React from "react";

type ThemeMode = "light" | "dark" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
};

const STORAGE_KEY = "lekhaly-theme";

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = mode === "dark" || (mode === "system" && prefersDark);
  root.classList.toggle("dark", isDark);
  root.dataset.theme = mode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  React.useEffect(() => {
    const getStoredTheme = () => {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      return stored ?? "system";
    };

    const handleSystemChange = () => {
      const mode = getStoredTheme();
      if (mode === "system") applyTheme("system");
    };

    const handleThemeChange = (event: Event) => {
      const detail = (event as CustomEvent<{ theme: ThemeMode }>).detail;
      const mode = detail?.theme ?? getStoredTheme();
      applyTheme(mode);
    };

    applyTheme(getStoredTheme());

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleSystemChange);
    } else {
      mediaQuery.addListener(handleSystemChange);
    }

    window.addEventListener("lekhaly-theme-change", handleThemeChange);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleSystemChange);
      } else {
        mediaQuery.removeListener(handleSystemChange);
      }
      window.removeEventListener("lekhaly-theme-change", handleThemeChange);
    };
  }, []);

  return <>{children}</>;
}
