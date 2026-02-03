"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ThemeMode = "light" | "dark";
type ThemeSetting = "auto" | "light" | "dark";
type AccentColor = "blue" | "orange" | "green";

interface ThemeContextType {
  themeMode: ThemeMode;
  themeSetting: ThemeSetting;
  accentColor: AccentColor;
  setThemeSetting: (setting: ThemeSetting) => void;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeSetting, setThemeSettingState] = useState<ThemeSetting>(() => {
    if (typeof window === "undefined") return "auto";
    const savedTheme = localStorage.getItem("theme_setting") as ThemeSetting;
    if (savedTheme && ["auto", "light", "dark"].includes(savedTheme)) {
      return savedTheme;
    }
    return "auto";
  });
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    if (typeof window === "undefined") return "blue";
    const savedAccent = localStorage.getItem("accent_color") as AccentColor;
    if (savedAccent && ["blue", "orange", "green"].includes(savedAccent)) {
      return savedAccent;
    }
    return "blue";
  });
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const applyEffectiveTheme = (effectiveTheme: ThemeMode) => {
      setThemeMode(effectiveTheme);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(effectiveTheme);
    };

    const calculateEffectiveTheme = (): ThemeMode => {
      if (themeSetting === "auto") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        return prefersDark ? "dark" : "light";
      }
      return themeSetting;
    };

    applyEffectiveTheme(calculateEffectiveTheme());

    if (themeSetting !== "auto") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => applyEffectiveTheme(calculateEffectiveTheme());

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [themeSetting]);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (themeMode === "dark") {
        switch (accentColor) {
          case "blue":
            root.style.setProperty("--primary", "#90CAF9");
            root.style.setProperty("--primary-container", "#1E3A8A");
            root.style.setProperty("--selected-bg", "#1E3A8A");
            root.style.setProperty("--selected-border", "#90CAF9");
            break;
          case "orange":
            root.style.setProperty("--primary", "#FFB74D");
            root.style.setProperty("--primary-container", "#E65100");
            root.style.setProperty("--selected-bg", "#E65100");
            root.style.setProperty("--selected-border", "#FFB74D");
            break;
          case "green":
            root.style.setProperty("--primary", "#81C784");
            root.style.setProperty("--primary-container", "#1B5E20");
            root.style.setProperty("--selected-bg", "#1B5E20");
            root.style.setProperty("--selected-border", "#81C784");
            break;
        }
      } else {
        switch (accentColor) {
          case "blue":
            root.style.setProperty("--primary", "#2196F3");
            root.style.setProperty("--primary-container", "#E3F2FD");
            root.style.setProperty("--selected-bg", "#E3F2FD");
            root.style.setProperty("--selected-border", "#1976D2");
            break;
          case "orange":
            root.style.setProperty("--primary", "#FF9800");
            root.style.setProperty("--primary-container", "#FFF3E0");
            root.style.setProperty("--selected-bg", "#FFF3E0");
            root.style.setProperty("--selected-border", "#F57C00");
            break;
          case "green":
            root.style.setProperty("--primary", "#4CAF50");
            root.style.setProperty("--primary-container", "#E8F5E8");
            root.style.setProperty("--selected-bg", "#E8F5E8");
            root.style.setProperty("--selected-border", "#2E7D32");
            break;
        }
      }
    }
  }, [accentColor, themeMode]);

  const setThemeSetting = (setting: ThemeSetting) => {
    setThemeSettingState(setting);
    localStorage.setItem("theme_setting", setting);
  };

  const setAccentColor = (color: AccentColor) => {
    setAccentColorState(color);
    localStorage.setItem("accent_color", color);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        themeSetting,
        accentColor,
        setThemeSetting,
        setAccentColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}









