import { supabase } from "./supabaseClient";

export interface DashboardWidget {
  id: string;
  user_id: string;
  title: string;
  widget_type: "kpi" | "table" | "bar" | "pie" | "line" | "donut" | "area";
  workbook_id: string;
  worksheet_id: string;
  workbook_name?: string;
  worksheet_name?: string;
  value_col: string;
  value_cols?: string[];
  group_by_col?: string;
  aggregation: "count" | "sum" | "avg" | "none";
  config?: Record<string, any>;
  created_by: string;
  created_at: string;
}

export const getWidgetsForUser = async (userId: string): Promise<DashboardWidget[]> => {
  const { data, error } = await supabase
    .from("dashboard_widgets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Failed to fetch dashboard widgets:", error);
    return [];
  }
  
  return (data ?? []) as DashboardWidget[];
};

export const createWidgetAssignment = async (widget: Omit<DashboardWidget, "id" | "created_at">): Promise<DashboardWidget | null> => {
  const { data, error } = await supabase
    .from("dashboard_widgets")
    .insert({
      user_id: widget.user_id,
      title: widget.title,
      widget_type: widget.widget_type,
      workbook_id: widget.workbook_id,
      worksheet_id: widget.worksheet_id,
      workbook_name: widget.workbook_name,
      worksheet_name: widget.worksheet_name,
      value_col: widget.value_col,
      value_cols: widget.value_cols,
      group_by_col: widget.group_by_col,
      aggregation: widget.aggregation,
      config: widget.config,
      created_by: widget.created_by,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Failed to create widget assignment:", error);
    return null;
  }
  
  return data as DashboardWidget;
};

export const updateWidgetAssignment = async (id: string, updates: Partial<Omit<DashboardWidget, "id" | "user_id" | "created_at">>): Promise<DashboardWidget | null> => {
  const { data, error } = await supabase
    .from("dashboard_widgets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  
  if (error) {
    console.error("Failed to update widget assignment:", error);
    return null;
  }
  
  return data as DashboardWidget;
};

export const deleteWidgetAssignment = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from("dashboard_widgets")
    .delete()
    .eq("id", id);
  
  if (error) {
    console.error("Failed to delete widget assignment:", error);
    return false;
  }
  
  return true;
};

export const deleteWidgetsByWorkbook = async (workbookId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("dashboard_widgets")
    .delete()
    .eq("workbook_id", workbookId);
  
  if (error) {
    console.error("Failed to delete widgets for workbook:", error);
    return false;
  }
  
  return true;
};