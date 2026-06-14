import { supabase } from "./supabaseClient";
import { sanitizeColumnName } from "../utils/sharedUtils";

export type Worksheet = {
  id: string;
  workbook_id: string;
  name: string;
  position?: number;
  created_at?: string;
  updated_at?: string;
};

export type ColumnMetadata = {
  id: string;
  sheet_id: string;
  name: string;
  display_name: string;
  data_type: string;
  order: number;
  hidden?: boolean;
};

export type WorksheetUpdate = {
  title?: string;
};

const sanitizeCol = sanitizeColumnName;

/** Get worksheets for a given workbook - uses sheets table */
export const getWorksheets = async (workbookId: string): Promise<Worksheet[]> => {
  const { data, error } = await supabase
    .from("sheets")
    .select("*")
    .eq("workbook_id", workbookId);
  if (error) throw error;
  return (data ?? []) as Worksheet[];
};

/** Create a new worksheet within a workbook */
export const createWorksheet = async (workbookId: string, title: string): Promise<Worksheet> => {
  const { data, error } = await supabase
    .from("sheets")
    .insert({ workbook_id: workbookId, name: title })
    .select()
    .single();
  if (error) throw error;
  return data as Worksheet;
};

/** Update a worksheet's properties */
export const updateWorksheet = async (id: string, updates: WorksheetUpdate): Promise<Worksheet> => {
  const { data, error } = await supabase
    .from("sheets")
    .update({ name: updates.title })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Worksheet;
};

/** Get column metadata for a worksheet - uses columns table */
export const getColumns = async (worksheetId: string): Promise<ColumnMetadata[]> => {
  const { data, error } = await supabase
    .from("columns")
    .select("*")
    .eq("sheet_id", worksheetId)
    .order("display_order", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((col: any) => ({
    id: String(col.id),
    sheet_id: String(col.sheet_id),
    name: sanitizeCol(col.name),
    display_name: col.name,
    data_type: col.inferred_type || "text",
    order: col.display_order || 0,
    hidden: col.is_hidden || false,
  }));
};

/** Update display name of a column in columns table */
export const updateColumnDisplayName = async (
  worksheetId: string,
  accessor: string,
  displayName: string
): Promise<any> => {
  const { data: cols, error: fetchErr } = await supabase
    .from("columns")
    .select("*")
    .eq("sheet_id", worksheetId);
  if (fetchErr) throw fetchErr;

  const target = cols?.find((c: any) => sanitizeCol(c.name) === accessor);
  if (!target) throw new Error("Column not found");

  const { data, error } = await supabase
    .from("columns")
    .update({ name: displayName })
    .eq("id", target.id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Hide/show a column in columns table */
export const hideColumn = async (
  worksheetId: string,
  accessor: string,
  hidden: boolean
): Promise<any> => {
  const { data: cols, error: fetchErr } = await supabase
    .from("columns")
    .select("*")
    .eq("sheet_id", worksheetId);
  if (fetchErr) throw fetchErr;

  const target = cols?.find((c: any) => sanitizeCol(c.name) === accessor);
  if (!target) throw new Error("Column not found");

  const { data, error } = await supabase
    .from("columns")
    .update({ is_hidden: hidden })
    .eq("id", target.id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Reorder columns in columns table */
export const reorderColumns = async (
  worksheetId: string,
  columnOrders: { accessor: string; order: number }[]
): Promise<void> => {
  const { data: cols, error: fetchErr } = await supabase
    .from("columns")
    .select("*")
    .eq("sheet_id", worksheetId);
  if (fetchErr) throw fetchErr;

  const updates = columnOrders.map(({ accessor, order }) => {
    const target = cols?.find((c: any) => sanitizeCol(c.name) === accessor);
    if (!target) return Promise.resolve({ error: new Error("Column not found") });

    return supabase
      .from("columns")
      .update({ display_order: order })
      .eq("id", target.id);
  });

  const results = await Promise.all(updates);
  const firstError = results.find((r) => r.error);
  if (firstError?.error) throw firstError.error;
};

/**
 * Maps system internal titles (e.g. "Sheet Node X") to human-descriptive titles.
 */
export const getCleanSheetName = (sheetId: string | number, dbName: string): string => {
  const idStr = String(sheetId);
  const mappings: Record<string, string> = {
    "3": "Sheet1",
    "5": "Fatima April Sheet",
    "7": "Weekly Sheet 05_30",
    "8": "Weekly Sheet 06_06",
    "9": "RedFlag",
    "10": "Redflag_1",
    "11": "Terms  - OKR",
    "12": "OKR",
    "13": "Exit Interview",
    "14": "Leave plan",
    "15": "CNPS",
    "16": "Client Allocation",
    "17": "Google Leave",
    "18": "Amazon",
    "19": "AMER activity",
    "20": "AM-DM",
    "21": "Fatima April Sheet",
    "22": "Lead",
    "23": "Weekly Sheet 05_30"
  };

  if (mappings[idStr]) {
    return mappings[idStr];
  }

  if (dbName && dbName.startsWith("Sheet Node ")) {
    const num = dbName.replace("Sheet Node ", "");
    if (mappings[num]) return mappings[num];
    return `Sheet ${num}`;
  }

  return dbName || `Sheet ${sheetId}`;
};

export interface ParsedColumnType {
  baseType: string;
  options: string[];
  required: boolean;
  defaultValue: string;
}

export const parseColumnType = (inferredType: string): ParsedColumnType => {
  const parts = (inferredType || "text").split("|");
  const typePart = parts[0] || "text";

  let baseType = "Text";
  let options: string[] = [];

  if (typePart.startsWith("single-select:") || typePart.startsWith("select:")) {
    baseType = "Single Select";
    const optStr = typePart.substring(typePart.indexOf(":") + 1);
    options = optStr.split(",").map(o => o.trim()).filter(Boolean);
  } else if (typePart.startsWith("multi-select:")) {
    baseType = "Multi Select";
    const optStr = typePart.substring(typePart.indexOf(":") + 1);
    options = optStr.split(",").map(o => o.trim()).filter(Boolean);
  } else {
    const lower = typePart.toLowerCase();
    if (lower === "text") baseType = "Text";
    else if (lower === "number") baseType = "Number";
    else if (lower === "date") baseType = "Date";
    else if (lower === "datetime" || lower === "timestamp") baseType = "DateTime";
    else if (lower === "boolean" || lower === "bool") baseType = "Boolean";
    else if (lower === "email") baseType = "Email";
    else if (lower === "phone") baseType = "Phone";
    else if (lower === "url") baseType = "URL";
    else if (lower === "long text" || lower === "longtext") baseType = "Long Text";
    else baseType = typePart;
  }

  let required = false;
  let defaultValue = "";

  for (let i = 1; i < parts.length; i++) {
    const p = parts[i];
    if (p === "required") {
      required = true;
    } else if (p.startsWith("default:")) {
      defaultValue = p.substring(8);
    }
  }

  return { baseType, options, required, defaultValue };
};

export const formatColumnType = (info: ParsedColumnType): string => {
  let typePart = info.baseType.toLowerCase();
  if (info.baseType === "Single Select") {
    typePart = `single-select:${info.options.join(",")}`;
  } else if (info.baseType === "Multi Select") {
    typePart = `multi-select:${info.options.join(",")}`;
  } else if (info.baseType === "Long Text") {
    typePart = "longtext";
  } else if (info.baseType === "DateTime") {
    typePart = "datetime";
  }

  const result: string[] = [typePart];
  if (info.required) result.push("required");
  if (info.defaultValue) result.push(`default:${info.defaultValue}`);

  return result.join("|");
};

/** Create a new column in columns table */
export const createColumn = async (
  worksheetId: string,
  displayName: string,
  inferredType: string,
  displayOrder: number
): Promise<any> => {
  const { data, error } = await supabase
    .from("columns")
    .insert({
      sheet_id: parseInt(worksheetId),
      name: displayName,
      inferred_type: inferredType,
      is_hidden: false,
      display_order: displayOrder
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Delete a column from columns table */
export const deleteColumn = async (
  worksheetId: string,
  accessor: string
): Promise<any> => {
  const { data: cols, error: fetchErr } = await supabase
    .from("columns")
    .select("*")
    .eq("sheet_id", worksheetId);
  if (fetchErr) throw fetchErr;

  const target = cols?.find((c: any) => sanitizeCol(c.name) === accessor);
  if (!target) throw new Error("Column not found");

  const { data, error } = await supabase
    .from("columns")
    .delete()
    .eq("id", target.id);
  if (error) throw error;
  return data;
};