import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "talentrealm-theme";

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
  return "system";
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(getInitialTheme);

  const resolvedTheme = useMemo(() => {
    if (preference !== "system") return preference;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }, [preference]);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // Theme still works for this session if storage is unavailable.
    }
  }, [preference, resolvedTheme]);

  useEffect(() => {
    if (preference !== "system" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const update = () => {
      document.documentElement.dataset.theme = media.matches ? "light" : "dark";
      document.documentElement.style.colorScheme = media.matches ? "light" : "dark";
    };
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, [preference]);

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
