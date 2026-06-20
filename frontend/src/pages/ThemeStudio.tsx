import React, { useState, useEffect, useRef } from "react";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberButton } from "../components/ui/CyberButton";
import { CyberBadge } from "../components/ui/CyberBadge";
import { CyberTable, PremiumColumn } from "../components/ui/CyberTable";
import { CyberColorInput } from "../components/ui/CyberColorInput";
import { CyberModal } from "../components/ui/CyberModal";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { useTheme } from "../context/ThemeContext";
import { createTheme, updateTheme, deleteTheme, Theme, DEFAULT_THEME } from "../services/themeService";
import { Palette, Edit3, Trash2, Copy, Check, Download, Upload, RotateCcw, FolderOpen, ChevronDown, ChevronRight } from "lucide-react";

type ThemeForm = Omit<Theme, "id" | "created_at" | "is_active" | "created_by">;

const INITIAL_FORM: ThemeForm = {
  name: "",
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
};

const BUILT_IN_THEMES: { name: string; form: ThemeForm }[] = [
  {
    name: "Enterprise Blue",
    form: {
      ...INITIAL_FORM,
      name: "Enterprise Blue",
      primary_color: "#3B82F6", accent_color: "#60A5FA", background_color: "#EFF6FF", surface_color: "#FFFFFF",
      text_color: "#1E293B", secondary_color: "#64748B", text_secondary_color: "#475569", text_muted_color: "#94A3B8",
      border_color: "#CBD5E1", border_strong_color: "#94A3B8", success_color: "#22C55E", warning_color: "#EAB308",
      danger_color: "#EF4444", info_color: "#3B82F6", card_background: "#FFFFFF", modal_background: "#FFFFFF",
      sidebar_background: "#1E293B", header_background: "#FFFFFF", surface_elevated: "#F8FAFC",
      button_primary: "#3B82F6", button_primary_hover: "#2563EB", button_secondary: "transparent",
      button_secondary_hover: "#E2E8F0", hover_background: "#F1F5F9", selected_background: "#DBEAFE",
      shadow_color: "rgba(59,130,246,0.12)",
    },
  },
  {
    name: "Executive Dark",
    form: {
      ...INITIAL_FORM,
      name: "Executive Dark",
      primary_color: "#6366F1", accent_color: "#818CF8", background_color: "#0F172A", surface_color: "#1E293B",
      text_color: "#F1F5F9", secondary_color: "#64748B", text_secondary_color: "#CBD5E1", text_muted_color: "#64748B",
      border_color: "#334155", border_strong_color: "#475569", success_color: "#22C55E", warning_color: "#EAB308",
      danger_color: "#EF4444", info_color: "#6366F1", card_background: "#1E293B", modal_background: "#1E293B",
      sidebar_background: "#0F172A", header_background: "#1E293B", surface_elevated: "#334155",
      button_primary: "#6366F1", button_primary_hover: "#4F46E5", button_secondary: "transparent",
      button_secondary_hover: "#334155", hover_background: "#334155", selected_background: "#334155",
      shadow_color: "rgba(99,102,241,0.15)",
    },
  },
  {
    name: "Emerald Operations",
    form: {
      ...INITIAL_FORM,
      name: "Emerald Operations",
      primary_color: "#10B981", accent_color: "#34D399", background_color: "#ECFDF5", surface_color: "#FFFFFF",
      text_color: "#1E293B", secondary_color: "#64748B", text_secondary_color: "#475569", text_muted_color: "#94A3B8",
      border_color: "#D1FAE5", border_strong_color: "#6EE7B7",
      button_primary: "#10B981", button_primary_hover: "#059669",
    },
  },
  {
    name: "Cyber Neon",
    form: {
      ...INITIAL_FORM,
      name: "Cyber Neon",
      primary_color: "#00FF9D", accent_color: "#00E5FF", background_color: "#0A0A1A", surface_color: "#1A1A2E",
      text_color: "#E2E8F0", secondary_color: "#64748B", text_secondary_color: "#CBD5E1", text_muted_color: "#64748B",
      border_color: "#2D2D4A", border_strong_color: "#00FF9D44", success_color: "#00FF9D", warning_color: "#FFB800",
      danger_color: "#FF4D6D", info_color: "#00E5FF", card_background: "#1A1A2E", modal_background: "#16213E",
      sidebar_background: "#0A0A1A", header_background: "#1A1A2E", surface_elevated: "#2D2D4A",
      button_primary: "#00FF9D", button_primary_hover: "#00CC7A", button_secondary: "transparent",
      button_secondary_hover: "#2D2D4A", hover_background: "#2D2D4A", selected_background: "#00FF9D22",
      shadow_color: "rgba(0,255,157,0.15)",
    },
  },
  {
    name: "Purple Matrix",
    form: {
      ...INITIAL_FORM,
      name: "Purple Matrix",
      primary_color: "#A855F7", accent_color: "#C084FC", background_color: "#0F0717", surface_color: "#1E1029",
      text_color: "#F1F5F9", secondary_color: "#64748B", text_secondary_color: "#CBD5E1", text_muted_color: "#64748B",
      border_color: "#3B1F54", border_strong_color: "#7C3AED66",
      button_primary: "#A855F7", button_primary_hover: "#9333EA",
      card_background: "#1E1029", modal_background: "#1E1029", sidebar_background: "#0F0717",
      shadow_color: "rgba(168,85,247,0.15)",
    },
  },
  {
    name: "Graphite Pro",
    form: {
      ...INITIAL_FORM,
      name: "Graphite Pro",
      primary_color: "#71717A", accent_color: "#A1A1AA", background_color: "#FAFAFA", surface_color: "#FFFFFF",
      text_color: "#18181B", secondary_color: "#52525B", text_secondary_color: "#3F3F46", text_muted_color: "#A1A1AA",
      border_color: "#E4E4E7", border_strong_color: "#D4D4D8",
      button_primary: "#27272A", button_primary_hover: "#3F3F46",
      sidebar_background: "#27272A", header_background: "#FFFFFF",
      shadow_color: "rgba(0,0,0,0.06)",
    },
  },
  {
    name: "Midnight Finance",
    form: {
      ...INITIAL_FORM,
      name: "Midnight Finance",
      primary_color: "#F59E0B", accent_color: "#FBBF24", background_color: "#0C0C1D", surface_color: "#1A1A2E",
      text_color: "#F1F5F9", secondary_color: "#64748B", text_secondary_color: "#CBD5E1", text_muted_color: "#64748B",
      border_color: "#2D2D4A", border_strong_color: "#F59E0B44",
      button_primary: "#F59E0B", button_primary_hover: "#D97706",
      card_background: "#1A1A2E", modal_background: "#1A1A2E", sidebar_background: "#0C0C1D",
      shadow_color: "rgba(245,158,11,0.15)",
    },
  },
  {
    name: "Ocean Glass",
    form: {
      ...INITIAL_FORM,
      name: "Ocean Glass",
      primary_color: "#0EA5E9", accent_color: "#38BDF8", background_color: "#F0F9FF", surface_color: "#FFFFFF",
      text_color: "#0F172A", secondary_color: "#64748B", text_secondary_color: "#475569", text_muted_color: "#94A3B8",
      border_color: "#E0F2FE", border_strong_color: "#7DD3FC",
      button_primary: "#0EA5E9", button_primary_hover: "#0284C7",
      sidebar_background: "#0F172A", header_background: "#FFFFFF",
      shadow_color: "rgba(14,165,233,0.10)",
    },
  },
];

const ThemeStudio: React.FC = () => {
  const { appUser } = useAuth();
  const toast = useToast();
  const { theme: activeTheme, themes, loading: themeLoading, refreshThemes, applyThemeById } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ThemeForm>({ ...INITIAL_FORM });
  const [isSaving, setIsSaving] = useState(false);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [deletingTheme, setDeletingTheme] = useState<Theme | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    core: true, extended: false, semantic: false, surfaces: false, interactive: false, effects: false, advanced: false,
  });
  const [importedJson, setImportedJson] = useState<string | null>(null);

  useEffect(() => {
    refreshThemes();
  }, [refreshThemes]);

  const updateField = <K extends keyof ThemeForm>(key: K, value: ThemeForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm({ ...INITIAL_FORM });
    setEditingTheme(null);
    setImportedJson(null);
  };

  const loadThemeIntoForm = (theme: Theme) => {
    setForm({
      name: theme.name,
      primary_color: theme.primary_color, accent_color: theme.accent_color,
      background_color: theme.background_color, surface_color: theme.surface_color, text_color: theme.text_color,
      secondary_color: theme.secondary_color || INITIAL_FORM.secondary_color,
      text_secondary_color: theme.text_secondary_color || INITIAL_FORM.text_secondary_color,
      text_muted_color: theme.text_muted_color || INITIAL_FORM.text_muted_color,
      border_color: theme.border_color || INITIAL_FORM.border_color,
      border_strong_color: theme.border_strong_color || INITIAL_FORM.border_strong_color,
      success_color: theme.success_color || INITIAL_FORM.success_color,
      warning_color: theme.warning_color || INITIAL_FORM.warning_color,
      danger_color: theme.danger_color || INITIAL_FORM.danger_color,
      info_color: theme.info_color || INITIAL_FORM.info_color,
      card_background: theme.card_background || INITIAL_FORM.card_background,
      modal_background: theme.modal_background || INITIAL_FORM.modal_background,
      sidebar_background: theme.sidebar_background || INITIAL_FORM.sidebar_background,
      header_background: theme.header_background || INITIAL_FORM.header_background,
      surface_elevated: theme.surface_elevated || INITIAL_FORM.surface_elevated,
      button_primary: theme.button_primary || theme.primary_color,
      button_primary_hover: theme.button_primary_hover || theme.accent_color,
      button_secondary: theme.button_secondary || INITIAL_FORM.button_secondary,
      button_secondary_hover: theme.button_secondary_hover || INITIAL_FORM.button_secondary_hover,
      hover_background: theme.hover_background || INITIAL_FORM.hover_background,
      selected_background: theme.selected_background || INITIAL_FORM.selected_background,
      shadow_color: theme.shadow_color || INITIAL_FORM.shadow_color,
      card_style: theme.card_style || "elevated",
      border_style: theme.border_style || "rounded",
      density: theme.density || "normal",
    });
    setEditingTheme(theme);
  };

  const applyPreview = () => {
    const root = document.documentElement;
    const t = { ...form };
    root.style.setProperty("--primary", t.primary_color);
    root.style.setProperty("--secondary", t.secondary_color);
    root.style.setProperty("--accent", t.accent_color);
    root.style.setProperty("--background", t.background_color);
    root.style.setProperty("--surface", t.surface_color);
    root.style.setProperty("--surface-elevated", t.surface_elevated);
    root.style.setProperty("--card-background", t.card_background);
    root.style.setProperty("--modal-background", t.modal_background);
    root.style.setProperty("--sidebar-background", t.sidebar_background);
    root.style.setProperty("--header-background", t.header_background);
    root.style.setProperty("--text", t.text_color);
    root.style.setProperty("--text-secondary", t.text_secondary_color);
    root.style.setProperty("--text-muted", t.text_muted_color);
    root.style.setProperty("--border", t.border_color);
    root.style.setProperty("--border-strong", t.border_strong_color);
    root.style.setProperty("--success", t.success_color);
    root.style.setProperty("--warning", t.warning_color);
    root.style.setProperty("--danger", t.danger_color);
    root.style.setProperty("--info", t.info_color);
    root.style.setProperty("--button-primary", t.button_primary);
    root.style.setProperty("--button-primary-hover", t.button_primary_hover);
    root.style.setProperty("--hover-bg", t.hover_background);
    root.style.setProperty("--selected-bg", t.selected_background);
    root.style.setProperty("--shadow-color", t.shadow_color);
    root.setAttribute("data-card-style", t.card_style);
    root.setAttribute("data-border-style", t.border_style);
    root.setAttribute("data-density", t.density);
  };

  const handleSaveTheme = async () => {
    if (!form.name.trim()) { toast.error("Theme name is required"); return; }
    setIsSaving(true);
    try {
      const themeData = {
        name: form.name,
        primary_color: form.primary_color, accent_color: form.accent_color,
        background_color: form.background_color, surface_color: form.surface_color, text_color: form.text_color,
        secondary_color: form.secondary_color, text_secondary_color: form.text_secondary_color,
        text_muted_color: form.text_muted_color, border_color: form.border_color,
        border_strong_color: form.border_strong_color, success_color: form.success_color,
        warning_color: form.warning_color, danger_color: form.danger_color, info_color: form.info_color,
        card_background: form.card_background, modal_background: form.modal_background,
        sidebar_background: form.sidebar_background, header_background: form.header_background,
        surface_elevated: form.surface_elevated, button_primary: form.button_primary,
        button_primary_hover: form.button_primary_hover, button_secondary: form.button_secondary,
        button_secondary_hover: form.button_secondary_hover, hover_background: form.hover_background,
        selected_background: form.selected_background, shadow_color: form.shadow_color,
        card_style: form.card_style, border_style: form.border_style, density: form.density,
      };

      if (editingTheme) {
        await updateTheme(editingTheme.id, themeData);
        toast.success("Theme updated");
      } else {
        await createTheme({ ...themeData, is_active: false, created_by: String(appUser?.id || "") });
        toast.success("Theme saved");
      }
      resetForm();
      refreshThemes();
    } catch { toast.error(editingTheme ? "Failed to update theme" : "Failed to save theme"); }
    finally { setIsSaving(false); }
  };

  const handleCloneTheme = async (theme: Theme) => {
    setIsSaving(true);
    try {
      await createTheme({
        name: `${theme.name} (Copy)`, primary_color: theme.primary_color,
        accent_color: theme.accent_color, background_color: theme.background_color,
        surface_color: theme.surface_color, text_color: theme.text_color,
        secondary_color: theme.secondary_color || INITIAL_FORM.secondary_color,
        text_secondary_color: theme.text_secondary_color || INITIAL_FORM.text_secondary_color,
        text_muted_color: theme.text_muted_color || INITIAL_FORM.text_muted_color,
        border_color: theme.border_color || INITIAL_FORM.border_color,
        border_strong_color: theme.border_strong_color || INITIAL_FORM.border_strong_color,
        success_color: theme.success_color || INITIAL_FORM.success_color,
        warning_color: theme.warning_color || INITIAL_FORM.warning_color,
        danger_color: theme.danger_color || INITIAL_FORM.danger_color,
        info_color: theme.info_color || INITIAL_FORM.info_color,
        card_background: theme.card_background || INITIAL_FORM.card_background,
        modal_background: theme.modal_background || INITIAL_FORM.modal_background,
        sidebar_background: theme.sidebar_background || INITIAL_FORM.sidebar_background,
        header_background: theme.header_background || INITIAL_FORM.header_background,
        surface_elevated: theme.surface_elevated || INITIAL_FORM.surface_elevated,
        button_primary: theme.button_primary || theme.primary_color,
        button_primary_hover: theme.button_primary_hover || theme.accent_color,
        button_secondary: theme.button_secondary || INITIAL_FORM.button_secondary,
        button_secondary_hover: theme.button_secondary_hover || INITIAL_FORM.button_secondary_hover,
        hover_background: theme.hover_background || INITIAL_FORM.hover_background,
        selected_background: theme.selected_background || INITIAL_FORM.selected_background,
        shadow_color: theme.shadow_color || INITIAL_FORM.shadow_color,
        card_style: theme.card_style || "elevated",
        border_style: theme.border_style || "rounded",
        density: theme.density || "normal",
        is_active: false, created_by: String(appUser?.id || ""),
      });
      toast.success("Theme cloned");
      refreshThemes();
    } catch { toast.error("Failed to clone theme"); }
    finally { setIsSaving(false); }
  };

  const handleDeleteTheme = async () => {
    if (!deletingTheme) return;
    setIsSaving(true);
    try {
      await deleteTheme(deletingTheme.id);
      toast.success("Theme deleted");
      setDeletingTheme(null);
      refreshThemes();
    } catch { toast.error("Failed to delete theme"); }
    finally { setIsSaving(false); }
  };

  const handleExportTheme = (theme: Theme) => {
    const exportData = {
      name: theme.name, primary_color: theme.primary_color, accent_color: theme.accent_color,
      background_color: theme.background_color, surface_color: theme.surface_color, text_color: theme.text_color,
      secondary_color: theme.secondary_color || INITIAL_FORM.secondary_color,
      text_secondary_color: theme.text_secondary_color || INITIAL_FORM.text_secondary_color,
      text_muted_color: theme.text_muted_color || INITIAL_FORM.text_muted_color,
      border_color: theme.border_color || INITIAL_FORM.border_color,
      border_strong_color: theme.border_strong_color || INITIAL_FORM.border_strong_color,
      success_color: theme.success_color || INITIAL_FORM.success_color,
      warning_color: theme.warning_color || INITIAL_FORM.warning_color,
      danger_color: theme.danger_color || INITIAL_FORM.danger_color,
      info_color: theme.info_color || INITIAL_FORM.info_color,
      card_background: theme.card_background || INITIAL_FORM.card_background,
      modal_background: theme.modal_background || INITIAL_FORM.modal_background,
      sidebar_background: theme.sidebar_background || INITIAL_FORM.sidebar_background,
      header_background: theme.header_background || INITIAL_FORM.header_background,
      surface_elevated: theme.surface_elevated || INITIAL_FORM.surface_elevated,
      button_primary: theme.button_primary || theme.primary_color,
      button_primary_hover: theme.button_primary_hover || theme.accent_color,
      hover_background: theme.hover_background || INITIAL_FORM.hover_background,
      selected_background: theme.selected_background || INITIAL_FORM.selected_background,
      shadow_color: theme.shadow_color || INITIAL_FORM.shadow_color,
      card_style: theme.card_style || "elevated",
      border_style: theme.border_style || "rounded",
      density: theme.density || "normal",
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${theme.name.replace(/\s+/g, "_")}_theme.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Theme exported");
  };

  const handleImportJson = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!data.name) { toast.error("Invalid theme file: missing name"); return; }
        setForm({
          ...INITIAL_FORM,
          ...data,
          name: data.name + " (Imported)",
          card_style: data.card_style || "elevated",
          border_style: data.border_style || "rounded",
          density: data.density || "normal",
        });
        setEditingTheme(null);
        toast.success("Theme imported — review and save");
      } catch { toast.error("Invalid JSON file"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleLoadBuiltIn = (builtIn: typeof BUILT_IN_THEMES[0]) => {
    setForm({ ...builtIn.form, name: builtIn.name });
    setEditingTheme(null);
    applyPreview();
    toast.success(`"${builtIn.name}" preview loaded`);
  };

  const handleResetToDefault = () => {
    setForm({ ...INITIAL_FORM });
    resetForm();
    applyPreview();
    toast.success("Reset to default preview");
  };

  const isFormModified = editingTheme !== null;

  const SectionToggle = ({ section, label }: { section: string; label: string }) => (
    <button onClick={() => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))}
      className="flex items-center gap-2 text-xs font-semibold text-textSecondary uppercase tracking-wider cursor-pointer hover:text-textPrimary transition-colors w-full text-left py-1">
      {expandedSections[section] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      {label}
    </button>
  );

  const columns: PremiumColumn[] = [
    { header: "Name", accessor: "name", render: (row) => <span>{row.name}</span> },
    { header: "Primary", accessor: "primary_color", render: (row) => (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border border-theme" style={{ backgroundColor: row.primary_color }} />
        <span className="text-xs text-theme-muted">{row.primary_color}</span>
      </div>
    )},
    { header: "Accent", accessor: "accent_color", render: (row) => (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded border border-theme" style={{ backgroundColor: row.accent_color }} />
        <span className="text-xs text-theme-muted">{row.accent_color}</span>
      </div>
    )},
    { header: "Style", accessor: "card_style", render: (row) => (
      <span className="text-xs text-theme-muted">{row.card_style || "elevated"}</span>
    )},
    { header: "Status", accessor: "is_active", render: (row) => (
      <CyberBadge variant={row.is_active ? "success" : "secondary"}>
        {row.is_active ? "Active" : "Inactive"}
      </CyberBadge>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-bold tracking-tight text-theme">Theme Studio</h1>
          <p className="text-theme-secondary font-sans text-sm">Create, manage, and preview application themes</p>
        </div>
        <div className="flex gap-2">
          <CyberButton size="sm" variant="secondary" onClick={handleResetToDefault}>
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset Preview
          </CyberButton>
          <CyberButton size="sm" variant="secondary" onClick={handleImportJson}>
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Import JSON
          </CyberButton>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ---- FORM PANEL ---- */}
        <CyberCard className="space-y-4">
          <h2 className="text-md font-sans font-semibold text-theme border-b border-theme pb-2 flex items-center justify-between">
            <span>{isFormModified ? "Edit Theme" : "Create Theme"}</span>
            {isFormModified && (
              <CyberBadge variant="info">Editing: {editingTheme?.name}</CyberBadge>
            )}
          </h2>

          <div className="space-y-1">
            <label className="text-xs text-theme-secondary">Theme Name</label>
            <input type="text" value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Enterprise Blue"
              className="w-full bg-theme-surface text-theme border border-theme rounded-md px-3 py-2 font-sans text-sm focus:outline-none focus:border-primary" />
          </div>

          {/* Built-in theme presets */}
          <div>
            <label className="text-xs text-theme-secondary mb-1.5 block">Built-in Themes</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {BUILT_IN_THEMES.map(bt => (
                <button key={bt.name} onClick={() => handleLoadBuiltIn(bt)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded text-[11px] border border-theme bg-theme-surface hover:bg-theme-hover transition-colors text-left">
                  <div className="w-3 h-3 rounded shrink-0" style={{ backgroundColor: bt.form.primary_color }} />
                  <span className="truncate text-theme">{bt.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-theme" />

          {/* Core Palette */}
          <SectionToggle section="core" label="Core Palette" />
          {expandedSections.core && (
            <div className="grid grid-cols-2 gap-3">
              <CyberColorInput label="Primary" value={form.primary_color} onChange={v => updateField("primary_color", v)} />
              <CyberColorInput label="Secondary" value={form.secondary_color} onChange={v => updateField("secondary_color", v)} />
              <CyberColorInput label="Accent" value={form.accent_color} onChange={v => updateField("accent_color", v)} />
              <CyberColorInput label="Background" value={form.background_color} onChange={v => updateField("background_color", v)} />
              <CyberColorInput label="Surface" value={form.surface_color} onChange={v => updateField("surface_color", v)} />
              <CyberColorInput label="Text" value={form.text_color} onChange={v => updateField("text_color", v)} />
            </div>
          )}

          {/* Extended Colors */}
          <SectionToggle section="extended" label="Extended Colors" />
          {expandedSections.extended && (
            <div className="grid grid-cols-2 gap-3">
              <CyberColorInput label="Text Secondary" value={form.text_secondary_color} onChange={v => updateField("text_secondary_color", v)} />
              <CyberColorInput label="Text Muted" value={form.text_muted_color} onChange={v => updateField("text_muted_color", v)} />
              <CyberColorInput label="Border" value={form.border_color} onChange={v => updateField("border_color", v)} />
              <CyberColorInput label="Border Strong" value={form.border_strong_color} onChange={v => updateField("border_strong_color", v)} />
            </div>
          )}

          {/* Semantic Colors */}
          <SectionToggle section="semantic" label="Semantic Colors" />
          {expandedSections.semantic && (
            <div className="grid grid-cols-2 gap-3">
              <CyberColorInput label="Success" value={form.success_color} onChange={v => updateField("success_color", v)} />
              <CyberColorInput label="Warning" value={form.warning_color} onChange={v => updateField("warning_color", v)} />
              <CyberColorInput label="Danger" value={form.danger_color} onChange={v => updateField("danger_color", v)} />
              <CyberColorInput label="Info" value={form.info_color} onChange={v => updateField("info_color", v)} />
            </div>
          )}

          {/* Surface Colors */}
          <SectionToggle section="surfaces" label="Surface Colors" />
          {expandedSections.surfaces && (
            <div className="grid grid-cols-2 gap-3">
              <CyberColorInput label="Card Background" value={form.card_background} onChange={v => updateField("card_background", v)} />
              <CyberColorInput label="Modal Background" value={form.modal_background} onChange={v => updateField("modal_background", v)} />
              <CyberColorInput label="Sidebar Background" value={form.sidebar_background} onChange={v => updateField("sidebar_background", v)} />
              <CyberColorInput label="Header Background" value={form.header_background} onChange={v => updateField("header_background", v)} />
              <CyberColorInput label="Surface Elevated" value={form.surface_elevated} onChange={v => updateField("surface_elevated", v)} />
            </div>
          )}

          {/* Interactive States */}
          <SectionToggle section="interactive" label="Interactive States" />
          {expandedSections.interactive && (
            <div className="grid grid-cols-2 gap-3">
              <CyberColorInput label="Button Primary" value={form.button_primary} onChange={v => updateField("button_primary", v)} />
              <CyberColorInput label="Button Primary Hover" value={form.button_primary_hover} onChange={v => updateField("button_primary_hover", v)} />
              <CyberColorInput label="Hover Background" value={form.hover_background} onChange={v => updateField("hover_background", v)} />
              <CyberColorInput label="Selected Background" value={form.selected_background} onChange={v => updateField("selected_background", v)} />
            </div>
          )}

          {/* Effects */}
          <SectionToggle section="effects" label="Effects" />
          {expandedSections.effects && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-theme-secondary">Shadow Color</label>
                <input type="text" value={form.shadow_color}
                  onChange={(e) => updateField("shadow_color", e.target.value)}
                  className="w-full bg-theme-surface text-theme border border-theme rounded-md px-3 py-2 font-sans text-sm focus:outline-none" />
              </div>
            </div>
          )}

          {/* Advanced */}
          <SectionToggle section="advanced" label="Advanced Styles" />
          {expandedSections.advanced && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-theme-secondary">Card Style</label>
                <select value={form.card_style} onChange={e => updateField("card_style", e.target.value as any)}
                  className="w-full bg-theme-surface text-theme border border-theme rounded-md px-2 py-2 text-xs">
                  <option value="flat">Flat</option>
                  <option value="elevated">Elevated</option>
                  <option value="glassmorphism">Glassmorphism</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-theme-secondary">Border Style</label>
                <select value={form.border_style} onChange={e => updateField("border_style", e.target.value as any)}
                  className="w-full bg-theme-surface text-theme border border-theme rounded-md px-2 py-2 text-xs">
                  <option value="sharp">Sharp</option>
                  <option value="rounded">Rounded</option>
                  <option value="pill">Pill</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-theme-secondary">Density</label>
                <select value={form.density} onChange={e => updateField("density", e.target.value as any)}
                  className="w-full bg-theme-surface text-theme border border-theme rounded-md px-2 py-2 text-xs">
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-theme">
            <CyberButton variant="primary" onClick={handleSaveTheme} disabled={isSaving}>
              {isSaving ? "Saving..." : isFormModified ? "Update Theme" : "Save Theme"}
            </CyberButton>
            <CyberButton variant="secondary" onClick={applyPreview}>
              <Palette className="w-3.5 h-3.5 mr-1" /> Preview
            </CyberButton>
            {isFormModified && (
              <CyberButton variant="secondary" onClick={resetForm}>Cancel</CyberButton>
            )}
          </div>
        </CyberCard>

        {/* ---- LIVE PREVIEW ---- */}
        <CyberCard className="space-y-4">
          <h2 className="text-md font-sans font-semibold text-theme border-b border-theme pb-2">Live Full-App Preview</h2>
          <div className="rounded-lg overflow-hidden border border-theme" style={{ background: form.background_color }}>
            {/* Mini Sidebar + Content */}
            <div className="flex min-h-[380px]">
              {/* Sidebar mock */}
              <div className="w-20 p-3 flex flex-col gap-2 shrink-0" style={{ background: form.sidebar_background, borderRight: `1px solid ${form.border_color}` }}>
                <div className="w-8 h-8 rounded-lg mb-3" style={{ background: form.primary_color }} />
                <div className="w-6 h-6 rounded" style={{ background: form.secondary_color }} />
                <div className="w-6 h-6 rounded" style={{ background: form.secondary_color }} />
                <div className="w-6 h-6 rounded" style={{ background: form.secondary_color }} />
                <div className="mt-auto w-6 h-6 rounded" style={{ background: form.danger_color }} />
              </div>
              {/* Content area */}
              <div className="flex-1 p-4 space-y-3" style={{ background: form.background_color, color: form.text_color }}>
                {/* Header bar */}
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: form.border_color }}>
                  <div className="text-xs font-bold tracking-wider" style={{ color: form.text_color }}>
                    {form.name || "THEME PREVIEW"}
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: form.danger_color }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: form.warning_color }} />
                    <div className="w-2 h-2 rounded-full" style={{ background: form.success_color }} />
                  </div>
                </div>

                {/* Stats row */}
                <div className="flex gap-2">
                  {["Total", "Active", "Pending"].map(label => (
                    <div key={label} className="flex-1 p-2.5 rounded-lg card-theme"
                      style={{ background: form.card_background, borderColor: form.border_color }}>
                      <div className="text-[9px] opacity-60" style={{ color: form.text_muted_color }}>{label}</div>
                      <div className="text-sm font-bold" style={{ color: form.text_color }}>{Math.floor(Math.random() * 100) + 10}</div>
                    </div>
                  ))}
                </div>

                {/* Table mock */}
                <div className="rounded-lg overflow-hidden border" style={{ borderColor: form.border_color, background: form.surface_color }}>
                  <div className="grid grid-cols-3 gap-0 text-[9px] font-semibold px-3 py-2"
                    style={{ background: `linear-gradient(180deg, ${form.primary_color}, ${form.accent_color})`, color: form.text_color }}>
                    <div>Name</div><div>Status</div><div>Value</div>
                  </div>
                  {["Alpha", "Beta", "Gamma"].map((name, i) => (
                    <div key={name} className="grid grid-cols-3 gap-0 text-[10px] px-3 py-2 border-t"
                      style={{ borderColor: form.border_color, background: i % 2 === 0 ? form.surface_color : `color-mix(in srgb, ${form.accent_color} 4%, ${form.surface_color})`, color: form.text_color }}>
                      <div>{name}</div>
                      <div><span className="px-1.5 py-0.5 rounded text-[8px] font-bold"
                        style={{ background: i === 0 ? form.success_color : i === 1 ? form.warning_color : form.danger_color, color: "#fff" }}>
                        {i === 0 ? "Active" : i === 1 ? "Pending" : "Failed"}
                      </span></div>
                      <div style={{ color: form.text_muted_color }}>${(i + 1) * 1000}</div>
                    </div>
                  ))}
                </div>

                {/* Card mock */}
                <div className="p-3 rounded-lg card-theme space-y-2"
                  style={{ background: form.card_background, borderColor: form.border_color }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg" style={{ background: form.primary_color }} />
                    <div>
                      <div className="text-xs font-bold" style={{ color: form.text_color }}>Sample Record Card</div>
                      <div className="text-[9px]" style={{ color: form.text_muted_color }}>ID: #42 — 2 hours ago</div>
                    </div>
                  </div>
                  <div className="text-[10px] leading-relaxed" style={{ color: form.text_secondary_color }}>
                    This card demonstrates how record cards, worksheet items, and workspace notes will appear.
                  </div>
                  <div className="flex gap-1.5 mt-1">
                    <button className="px-2.5 py-1 rounded text-[9px] font-bold"
                      style={{ background: form.button_primary, color: form.text_color }}>Primary</button>
                    <button className="px-2.5 py-1 rounded text-[9px]"
                      style={{ border: `1px solid ${form.border_color}`, color: form.text_secondary_color }}>Secondary</button>
                    <button className="px-2.5 py-1 rounded text-[9px]"
                      style={{ background: form.danger_color, color: "#fff" }}>Delete</button>
                  </div>
                </div>

                {/* Modal mock */}
                <div className="relative">
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 rounded-lg" />
                  <div className="relative z-20 mx-auto max-w-[200px] -mt-2 p-3 rounded-lg card-theme border shadow-lg"
                    style={{ background: form.modal_background, borderColor: form.border_strong_color }}>
                    <div className="text-[10px] font-bold mb-2" style={{ color: form.text_color }}>Modal Dialog</div>
                    <div className="text-[8px] mb-2" style={{ color: form.text_secondary_color }}>Modals now use theme colors.</div>
                    <input className="w-full px-2 py-1 rounded text-[9px] border mb-2"
                      style={{ background: form.surface_color, borderColor: form.border_color, color: form.text_color }} placeholder="Input field..." />
                    <div className="flex gap-1.5 justify-end">
                      <button className="px-2 py-0.5 rounded text-[8px]" style={{ border: `1px solid ${form.border_color}`, color: form.text_secondary_color }}>Cancel</button>
                      <button className="px-2 py-0.5 rounded text-[8px] font-bold" style={{ background: form.button_primary, color: form.text_color }}>Save</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CyberCard>
      </div>

      {/* ---- SAVED THEMES TABLE ---- */}
      <CyberCard className="space-y-4">
        <h2 className="text-md font-sans font-semibold text-theme border-b border-theme pb-2">Saved Themes ({themes.length})</h2>
        {themeLoading ? (
          <div className="p-8 text-center text-theme-muted">Loading themes...</div>
        ) : themes.length === 0 ? (
          <div className="p-8 text-center text-theme-muted">No themes created yet. Choose a built-in theme above or create one.</div>
        ) : (
          <CyberTable columns={columns} data={themes}
            actions={(row) => (
              <div className="flex gap-1.5">
                {row.is_active ? (
                  <CyberBadge variant="success">Active</CyberBadge>
                ) : (
                  <CyberButton size="sm" variant="primary" onClick={() => {
                    applyThemeById(row.id).then(() => { toast.success(`"${row.name}" applied`); refreshThemes(); }).catch(() => toast.error("Failed to apply theme"));
                  }}>
                    <Check className="w-3 h-3 mr-1" /> Apply
                  </CyberButton>
                )}
                <CyberButton size="sm" variant="secondary" onClick={() => loadThemeIntoForm(row)}>
                  <Edit3 className="w-3 h-3" />
                </CyberButton>
                <CyberButton size="sm" variant="secondary" onClick={() => handleCloneTheme(row)} disabled={isSaving}>
                  <Copy className="w-3 h-3" />
                </CyberButton>
                <CyberButton size="sm" variant="secondary" onClick={() => handleExportTheme(row)}>
                  <Download className="w-3 h-3" />
                </CyberButton>
                <CyberButton size="sm" variant="danger" onClick={() => setDeletingTheme(row)} disabled={row.is_active}>
                  <Trash2 className="w-3 h-3" />
                </CyberButton>
              </div>
            )}
          />
        )}
      </CyberCard>

      {/* DELETE MODAL */}
      <CyberModal isOpen={deletingTheme !== null} onClose={() => setDeletingTheme(null)} title="Delete Theme">
        <div className="space-y-4">
          <p className="text-sm">Are you sure you want to delete <strong>{deletingTheme?.name}</strong>? This action cannot be undone.</p>
          {deletingTheme?.is_active && (
            <p className="text-sm text-danger">Cannot delete the active theme. Switch to another theme first.</p>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <CyberButton variant="secondary" onClick={() => setDeletingTheme(null)}>Cancel</CyberButton>
            <CyberButton variant="danger" onClick={handleDeleteTheme} disabled={isSaving || deletingTheme?.is_active}>
              {isSaving ? "Deleting..." : "Delete"}
            </CyberButton>
          </div>
        </div>
      </CyberModal>
    </div>
  );
};

export default ThemeStudio;
