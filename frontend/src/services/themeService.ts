import { supabase } from "./supabaseClient";

export interface Theme {
  id: string;
  name: string;

  // Core palette (5 originals)
  primary_color: string;
  accent_color: string;
  background_color: string;
  surface_color: string;
  text_color: string;

  // Extended palette (new)
  secondary_color: string;
  text_secondary_color: string;
  text_muted_color: string;
  border_color: string;
  border_strong_color: string;

  // Semantic
  success_color: string;
  warning_color: string;
  danger_color: string;
  info_color: string;

  // Surfaces
  card_background: string;
  modal_background: string;
  sidebar_background: string;
  header_background: string;
  surface_elevated: string;

  // Interactive
  button_primary: string;
  button_primary_hover: string;
  button_secondary: string;
  button_secondary_hover: string;
  hover_background: string;
  selected_background: string;

  // Effect
  shadow_color: string;

  // Card style
  card_style: "flat" | "elevated" | "glassmorphism";
  border_style: "sharp" | "rounded" | "pill";
  density: "compact" | "normal" | "spacious";

  // Meta
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export const DEFAULT_THEME: Theme = {
  id: "default",
  name: "Default",
  primary_color: "#ABE7B2",
  accent_color: "#CBF3BB",
  background_color: "#ECF4E8",
  surface_color: "#FFFFFF",
  text_color: "#1A1A2E",
  secondary_color: "#93BFC7",
  text_secondary_color: "#4A5568",
  text_muted_color: "#94A3B8",
  border_color: "#E2E8F0",
  border_strong_color: "#93BFC7",
  success_color: "#4ADE80",
  warning_color: "#FBBF24",
  danger_color: "#F87171",
  info_color: "#7FAED8",
  card_background: "#FFFFFF",
  modal_background: "#FFFFFF",
  sidebar_background: "#FFFFFF",
  header_background: "#FFFFFF",
  surface_elevated: "#F8FAFC",
  button_primary: "#ABE7B2",
  button_primary_hover: "#CBF3BB",
  button_secondary: "transparent",
  button_secondary_hover: "#E2E8F0",
  hover_background: "#F1F5F9",
  selected_background: "#E2E8F0",
  shadow_color: "rgba(0,0,0,0.08)",
  card_style: "elevated",
  border_style: "rounded",
  density: "normal",
  is_active: true,
  created_by: "system",
  created_at: new Date().toISOString(),
};

export const getThemes = async (): Promise<Theme[]> => {
  const { data, error } = await supabase
    .from("app_themes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getActiveTheme = async (): Promise<Theme | null> => {
  const { data, error } = await supabase
    .from("app_themes")
    .select("*")
    .eq("is_active", true)
    .single();
  if (error) return null;
  return data;
};

const BASE_COLUMNS = ["name", "primary_color", "accent_color", "background_color", "surface_color", "text_color", "is_active", "created_by"];

const tryWithFallback = async <T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err: any) {
    const msg = err?.message?.toLowerCase() || "";
    const code = err?.code || "";
    const isMissingColumn = code === "42703" || msg.includes("does not exist") || msg.includes("column") && msg.includes("not exist");
    if (isMissingColumn) {
      console.warn("[ThemeService] Extended columns not found in DB, using base columns. Run the migration.");
      return await fallback();
    }
    throw err;
  }
};

const toBaseTheme = (theme: any) => {
  const base: any = {};
  for (const key of BASE_COLUMNS) {
    if (theme[key] !== undefined) base[key] = theme[key];
  }
  return base;
};

export const createTheme = async (theme: Omit<Theme, "id" | "created_at">): Promise<Theme> => {
  return tryWithFallback(
    async () => {
      const { data, error } = await supabase
        .from("app_themes")
        .insert(theme)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async () => {
      const { data, error } = await supabase
        .from("app_themes")
        .insert(toBaseTheme(theme))
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  );
};

export const updateTheme = async (id: string, theme: Partial<Theme>): Promise<Theme> => {
  return tryWithFallback(
    async () => {
      const { data, error } = await supabase
        .from("app_themes")
        .update(theme)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async () => {
      const { data, error } = await supabase
        .from("app_themes")
        .update(toBaseTheme(theme))
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  );
};

export const applyTheme = async (themeId: string): Promise<void> => {
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
};

export const deleteTheme = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from("app_themes")
    .delete()
    .eq("id", id);
  if (error) throw error;
};