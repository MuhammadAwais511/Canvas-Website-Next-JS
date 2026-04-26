"use client";

import { useEffect, useState } from "react";
import { getStoredValue, setStoredValue } from "@/lib/local-storage";

const THEME_KEY = "canvasstudio_theme";
export type ThemeMode = "light" | "dark";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "light";
    const stored = getStoredValue<ThemeMode>(THEME_KEY, "light");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    return stored || (prefersDark ? "dark" : "light");
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    setStoredValue(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === "dark" ? "light" : "dark"));

  return { theme, toggleTheme };
}
