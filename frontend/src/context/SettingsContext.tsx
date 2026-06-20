import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

export interface Settings {
  hudAccent: "cyan" | "purple" | "green";
  soundEnabled: boolean;
  devConsoleMode: boolean;
  refreshInterval: number;
}

interface SettingsContextProps {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  playSound: (type: "click" | "success" | "error" | "warning") => void;
  log: (message: string, level?: "info" | "warn" | "error") => void;
}

const defaultSettings: Settings = {
  hudAccent: "cyan",
  soundEnabled: true,
  devConsoleMode: false,
  refreshInterval: 30,
};

const SettingsContext = createContext<SettingsContextProps | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem("app_settings");
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem("app_settings", JSON.stringify(settings));
    applyTheme(settings.hudAccent);
  }, [settings]);

  const applyTheme = (accent: "cyan" | "purple" | "green") => {
    const root = document.documentElement;
    const colors = {
      cyan: { primary: "var(--info)", secondary: "var(--border)", success: "var(--success)" },
      purple: { primary: "var(--secondary)", secondary: "var(--accent)", success: "var(--success)" },
      green: { primary: "var(--info)", secondary: "var(--border)", success: "var(--success)" },
    };
    const c = colors[accent];
    root.style.setProperty("--color-primary", c.primary);
    root.style.setProperty("--color-secondary", c.secondary);
    root.style.setProperty("--color-success", c.success);
  };

  const audioCache: Record<string, HTMLAudioElement> = {};

  const playSound = (type: "click" | "success" | "error" | "warning") => {
    if (!settings.soundEnabled) return;
    
    const sounds: Record<string, string> = {
      click: "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YU9vT18=",
      success: "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YU9vT18=",
      error: "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YU9vT18=",
      warning: "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YU9vT18=",
    };

    if (!audioCache[type]) {
      const audio = new Audio(sounds[type]);
      audioCache[type] = audio;
    }
    audioCache[type].currentTime = 0;
    audioCache[type].play().catch(() => {});
  };

  const log = (message: string, level: "info" | "warn" | "error" = "info") => {
    if (!settings.devConsoleMode) return;
    
    const timestamp = new Date().toISOString();
    const prefix = level === "error" ? "[ERROR]" : level === "warn" ? "[WARN]" : "[INFO]";
    console.log(`${prefix} ${timestamp} - ${message}`);
  };

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, playSound, log }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextProps => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};