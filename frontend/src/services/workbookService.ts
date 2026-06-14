import { supabase } from "./supabaseClient";
import { SHEET_TO_RECORD_TABLE } from "./rowService";

export type Workbook = {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type WorkbookUpdate = {
  name?: string;
  description?: string;
  tags?: string[];
};

export const getWorkbooks = async (): Promise<Workbook[]> => {
  const { data, error } = await supabase.from("workbooks").select("*");
  if (error) throw error;
  return (data ?? []) as Workbook[];
};

export const getWorkbook = async (id: string): Promise<Workbook> => {
  const { data, error } = await supabase
    .from("workbooks")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Workbook;
};

export const createWorkbook = async (name: string): Promise<Workbook> => {
  const { data, error } = await supabase
    .from("workbooks")
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data as Workbook;
};

let discoveredRecordsTables: string[] | null = null;

const discoverRecordsTables = async (): Promise<string[]> => {
  if (discoveredRecordsTables) return discoveredRecordsTables;
  
  try {
    const { data, error } = await supabase
      .from("sheets")
      .select("records_table_name")
      .not("records_table_name", "is", null);
      
    if (error) throw error;
    
    const tables = (data ?? [])
      .map((s: any) => s.records_table_name)
      .filter(Boolean);
      
    discoveredRecordsTables = [...new Set(tables)];
    return discoveredRecordsTables;
  } catch {
    discoveredRecordsTables = Object.values(SHEET_TO_RECORD_TABLE);
    return discoveredRecordsTables;
  }
};

const findRecordsTablesForSheets = async (sheetIds: string[]): Promise<string[]> => {
  const tables: string[] = [];
  
  try {
    const { data: sheets, error } = await supabase
      .from("sheets")
      .select("records_table_name")
      .in("id", sheetIds)
      .not("records_table_name", "is", null);
      
    if (!error && sheets) {
      for (const sheet of sheets) {
        if (sheet.records_table_name) {
          tables.push(sheet.records_table_name);
        }
      }
    }
  } catch {
    // ignore
  }
  
  for (const sheetId of sheetIds) {
    const stored = localStorage.getItem(`sheet_table_map_${sheetId}`);
    if (stored) {
      tables.push(stored);
    }
  }
  
  return [...new Set(tables)];
};

export type WorkbookDeletionResult = {
  workbookId: string;
  workbookName: string;
  sheetsDeleted: number;
  columnsDeleted: number;
  rowsDeleted: number;
  permissionsDeleted: number;
};

export const deleteWorkbook = async (
  workbookId: string, 
  workbookName?: string,
  userId?: string
): Promise<WorkbookDeletionResult> => {
  let result: WorkbookDeletionResult = {
    workbookId,
    workbookName: workbookName || "unknown",
    sheetsDeleted: 0,
    columnsDeleted: 0,
    rowsDeleted: 0,
    permissionsDeleted: 0,
  };
  
  const { data: wbCheck, error: wbCheckErr } = await supabase
    .from("workbooks")
    .select("id, name")
    .eq("id", workbookId)
    .single();
  
  if (wbCheckErr || !wbCheck) {
    throw new Error("Workbook not found or access denied");
  }
  
  result.workbookName = workbookName || wbCheck.name || "unknown";
  
  const { error: permError } = await supabase
    .from("user_roles")
    .delete()
    .eq("workbook_id", workbookId);
  if (permError && permError.code !== '42P01') {
    console.warn("Permission deletion warning:", permError);
  }
  
  const raw = localStorage.getItem("dashboard_assignments");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const cleaned: Record<string, any[]> = {};
      for (const [uid, widgets] of Object.entries(parsed)) {
        const filtered = (widgets as any[]).filter(w => w.workbookId !== workbookId);
        if (filtered.length > 0) cleaned[uid] = filtered;
      }
      localStorage.setItem("dashboard_assignments", JSON.stringify(cleaned));
    } catch {
      // ignore
    }
  }
  
  const { error: dashError } = await supabase
    .from("dashboard_assignments")
    .delete()
    .eq("workbook_id", workbookId);
  if (dashError && dashError.code !== '42P01') {
    console.warn("Dashboard assignments deletion warning:", dashError);
  }
  
  const { data: sheets, error: sheetsFetchErr } = await supabase
    .from("sheets")
    .select("id, records_table_name")
    .eq("workbook_id", workbookId);
  
  if (sheetsFetchErr) {
    throw sheetsFetchErr;
  }
  
  const sheetIds = (sheets ?? []).map((s: any) => s.id);
  result.sheetsDeleted = sheetIds.length;
  
  if (sheetIds.length > 0) {
    const { error: colError } = await supabase
      .from("columns")
      .delete()
      .in("sheet_id", sheetIds);
    if (colError) {
      console.warn("Columns deletion warning:", colError);
    }
  }
  
  const recordsTables = await findRecordsTablesForSheets(sheetIds);
  
  if (sheets) {
    sheets.forEach((s: any) => {
      if (s.records_table_name && !recordsTables.includes(s.records_table_name)) {
        recordsTables.push(s.records_table_name);
      }
    });
  }
  
  for (const table of recordsTables) {
    try {
      const { error: rowErr } = await supabase
        .from(table)
        .delete()
        .neq("id", 0);
      if (rowErr && rowErr.code !== '42P01') {
        console.warn(`Row deletion warning for ${table}:`, rowErr);
      }
    } catch {
      // ignore
    }
  }
  
  sheetIds.forEach(sheetId => {
    localStorage.removeItem(`local_rows_${sheetId}`);
  });
  
  const { error: sheetDelError } = await supabase
    .from("sheets")
    .delete()
    .eq("workbook_id", workbookId);
  if (sheetDelError) {
    console.warn("Sheets deletion warning:", sheetDelError);
  }
  
  const { error: wbDelError } = await supabase
    .from("workbooks")
    .delete()
    .eq("id", workbookId);
  if (wbDelError) {
    throw wbDelError;
  }
  
  try {
    const effectiveUserId = userId || "unknown";
    const timestamp = new Date().toISOString();
    
    await supabase.from("audit_logs").insert({
      user_id: effectiveUserId,
      workbook_id: workbookId,
      action: "DELETE_WORKBOOK",
      table_name: "workbooks",
      record_id: workbookId,
      payload: {
        action_type: "DELETE_WORKBOOK",
        workbook_name: result.workbookName,
        workbook_id: workbookId,
        timestamp,
      },
    });
    
    const logId = Math.random().toString(36).substring(2, 9);
    const rawLogs = localStorage.getItem("local_audit_logs");
    const logs = rawLogs ? JSON.parse(rawLogs) : [];
    logs.unshift({
      id: logId,
      timestamp,
      user_id: String(effectiveUserId),
      action: "DELETE_WORKBOOK",
      table_name: "workbooks",
      record_id: workbookId,
      payload: {
        action_type: "DELETE_WORKBOOK",
        workbook_name: result.workbookName,
      },
    });
    localStorage.setItem("local_audit_logs", JSON.stringify(logs));
  } catch {
    // ignore
  }
  
  return result;
};

export const verifyWorkbookDeleted = async (workbookId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from("workbooks")
    .select("id")
    .eq("id", workbookId)
    .single();
  
  if (error || !data) return true;
  return false;
};

export const updateWorkbook = async (id: string, updates: WorkbookUpdate): Promise<Workbook> => {
  const { data, error } = await supabase
    .from("workbooks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Workbook;
};