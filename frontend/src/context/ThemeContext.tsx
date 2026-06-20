import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { getActiveTheme, getThemes, Theme, DEFAULT_THEME } from "../services/themeService";
import { supabase } from "../services/supabaseClient";

interface ThemeContextProps {
  theme: Theme;
  themes: Theme[];
  loading: boolean;
  refreshThemes: () => Promise<void>;
  applyThemeById: (themeId: string) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

const applyCssVariables = (t: Theme) => {
  const root = document.documentElement;

  // Core palette
  root.style.setProperty("--primary", t.primary_color);
  root.style.setProperty("--secondary", t.secondary_color);
  root.style.setProperty("--accent", t.accent_color);

  // Backgrounds
  root.style.setProperty("--background", t.background_color);
  root.style.setProperty("--surface", t.surface_color);
  root.style.setProperty("--surface-elevated", t.surface_elevated);
  root.style.setProperty("--card-background", t.card_background);
  root.style.setProperty("--modal-background", t.modal_background);
  root.style.setProperty("--sidebar-background", t.sidebar_background);
  root.style.setProperty("--header-background", t.header_background);

  // Text
  root.style.setProperty("--text", t.text_color);
  root.style.setProperty("--text-secondary", t.text_secondary_color);
  root.style.setProperty("--text-muted", t.text_muted_color);

  // Borders
  root.style.setProperty("--border", t.border_color);
  root.style.setProperty("--border-strong", t.border_strong_color);

  // Semantic
  root.style.setProperty("--success", t.success_color);
  root.style.setProperty("--warning", t.warning_color);
  root.style.setProperty("--danger", t.danger_color);
  root.style.setProperty("--info", t.info_color);

  // Interactive
  root.style.setProperty("--button-primary", t.button_primary);
  root.style.setProperty("--button-primary-hover", t.button_primary_hover);
  root.style.setProperty("--button-secondary", t.button_secondary);
  root.style.setProperty("--button-secondary-hover", t.button_secondary_hover);
  root.style.setProperty("--hover-bg", t.hover_background);
  root.style.setProperty("--selected-bg", t.selected_background);

  // Effects
  root.style.setProperty("--shadow-color", t.shadow_color);

  // Card style — apply classes / data attributes instead of colors
  root.setAttribute("data-card-style", t.card_style);
  root.setAttribute("data-border-style", t.border_style);
  root.setAttribute("data-density", t.density);
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);

  const loadActiveTheme = useCallback(async () => {
    try {
      const activeTheme = await getActiveTheme();
      if (activeTheme) {
        setTheme(activeTheme);
        applyCssVariables(activeTheme);
      } else {
        setTheme(DEFAULT_THEME);
        applyCssVariables(DEFAULT_THEME);
      }
    } catch {
      setTheme(DEFAULT_THEME);
      applyCssVariables(DEFAULT_THEME);
    }
  }, []);

  const loadAllThemes = useCallback(async () => {
    try {
      const allThemes = await getThemes();
      setThemes(allThemes);
    } catch {
      setThemes([]);
    }
  }, []);

  const refreshThemes = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadActiveTheme(), loadAllThemes()]);
    setLoading(false);
  }, [loadActiveTheme, loadAllThemes]);

  const applyThemeById = useCallback(async (themeId: string) => {
    const { error } = await supabase
      .from("app_themes")
      .update({ is_active: false })
      .neq("id", themeId);
    if (error) throw error;

    const { error: updateError } = await supabase
      .from("app_themes")
      .update({ is_active: true })
      .eq("id", themeId);
    if (updateError) throw updateError;

    await refreshThemes();
  }, [refreshThemes]);

  useEffect(() => {
    refreshThemes();

    const themeSubscription = supabase
      .channel("app_themes_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_themes" },
        () => { refreshThemes(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(themeSubscription); };
  }, [refreshThemes]);

  return (
    <ThemeContext.Provider value={{ theme, themes, loading, refreshThemes, applyThemeById }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextProps => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
