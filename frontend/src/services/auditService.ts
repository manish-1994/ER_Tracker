import { supabase } from "./supabaseClient";
import { resolveRecordTable } from "./rowService";

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  action: string;
  table_name: string;
  record_id: string;
  payload: {
    action_type: string;
    old_value?: string;
    new_value?: string;
  };
}

/**
 * Log an audit entry in the database.
 * Hybrid storage persistence: writes to localStorage and attempts Supabase.
 */
export const logAudit = async (payload: {
  user_id: string;
  workbook_id?: string | null;
  worksheet_id: string;
  action: string;
  record_id?: string;
  old_value?: string;
  new_value?: string;
}): Promise<any> => {
  const logId = Math.random().toString(36).substring(2, 9);
  const timestamp = new Date().toISOString();

  const newLogEntry = {
    id: logId,
    timestamp,
    user_id: payload.user_id,
    action: payload.action,
    table_name: "records",
    record_id: payload.record_id || payload.worksheet_id,
    payload: {
      action_type: payload.action,
      worksheet_id: payload.worksheet_id,
      old_value: payload.old_value,
      new_value: payload.new_value,
    }
  };

  try {
    const raw = localStorage.getItem("local_audit_logs");
    const logs = raw ? JSON.parse(raw) : [];
    logs.unshift(newLogEntry);
    localStorage.setItem("local_audit_logs", JSON.stringify(logs));
  } catch {
    // ignore
  }

  try {
    const { data } = await supabase
      .from("audit_logs")
      .insert({
        user_id: typeof payload.user_id === "string" && payload.user_id !== "CURRENT_USER" ? (parseInt(payload.user_id) || null) : null,
        action: payload.action,
        table_name: "records",
        record_id: payload.record_id || payload.worksheet_id,
        payload: newLogEntry.payload
      })
      .select()
      .single();
    return data;
  } catch {
    return newLogEntry;
  }
};

/**
 * Fetch all audit logs (for SuperAdmin audit deck).
 */
export const getAllAuditLogs = async (): Promise<any[]> => {
  let localLogs: any[] = [];
  try {
    const raw = localStorage.getItem("local_audit_logs");
    if (raw) {
      localLogs = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("timestamp", { ascending: false });

    if (!error && data && data.length > 0) {
      const map = new Map();
      localLogs.forEach(l => map.set(l.id, l));
      data.forEach((l: any) => {
        map.set(l.id, {
          id: l.id,
          timestamp: l.timestamp,
          user_id: String(l.user_id),
          action: l.action,
          record_id: l.record_id,
          payload: l.payload
        });
      });
      return Array.from(map.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  } catch {
    // ignore and return local fallback
  }

  return localLogs;
};

/**
 * Fetch audit logs for a specific worksheet.
 */
export const getAuditLogs = async (worksheetId: string): Promise<any[]> => {
  try {
    const tableName = await resolveRecordTable(worksheetId);
    const all = await getAllAuditLogs();
    return all.filter(l => String(l.record_id) === String(worksheetId) || String(l.record_id) === tableName);
  } catch {
    return [];
  }
};

/**
 * Fetch audit logs for a specific record.
 */
export const getRecordAuditLogs = async (worksheetId: string, recordId: string): Promise<any[]> => {
  try {
    const all = await getAllAuditLogs();
    return all.filter(l =>
      String(l.record_id) === String(recordId) &&
      (String(l.payload?.worksheet_id) === String(worksheetId) || !l.payload?.worksheet_id)
    );
  } catch {
    return [];
  }
};