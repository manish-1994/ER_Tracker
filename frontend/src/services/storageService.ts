import { supabase } from "./supabaseClient";
import { getWorkbooks } from "./workbookService";
import { SHEET_TO_RECORD_TABLE } from "./rowService";
import { getWorksheets } from "./worksheetService";

export type StorageMetrics = {
  used: number;
  total: number;
  percentage: number;
  available: number;
};

export type DatabaseStats = {
  totalTables: number;
  totalRows: number;
  largestTable: string;
  largestTableRows: number;
};

export type ModuleStats = {
  module: string;
  sizeBytes: number;
  sizeFormatted: string;
  count: number;
};

export type WorkbookAnalysis = {
  id: string;
  name: string;
  sheetCount: number;
  rowCount: number;
  storageBytes: number;
  storageFormatted: string;
  lastModified: string | null;
};

// Default Supabase limits (for free tier)
const DEFAULT_DB_LIMIT_MB = 500;
const DEFAULT_STORAGE_LIMIT_GB = 5;

// Format bytes to human readable
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Discover all records tables from static map
let discoveredRecordsTables: string[] | null = null;

const discoverRecordsTables = async (): Promise<string[]> => {
  if (discoveredRecordsTables) return discoveredRecordsTables;
  discoveredRecordsTables = [...new Set(Object.values(SHEET_TO_RECORD_TABLE))];
  return discoveredRecordsTables;
};

// Estimate table size by counting rows (approximation)
const estimateTableSize = async (tableName: string): Promise<{ rows: number; bytes: number }> => {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });
    
    if (error) {
      return { rows: 0, bytes: 0 };
    }
    
    // Rough estimate: ~200 bytes per row for typical data
    const bytes = (count || 0) * 200;
    return { rows: count || 0, bytes };
  } catch (e) {
    return { rows: 0, bytes: 0 };
  }
};

// Get database usage metrics
export const getDatabaseUsage = async (): Promise<StorageMetrics> => {
  try {
    // Count rows in main tables
    const tables = ["workbooks", "sheets", "columns", "users", "user_roles", "roles", "audit_logs"];
    let totalBytes = 0;
    
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      totalBytes += (count || 0) * 200; // Estimate
    }
    
    // Add records tables
    const recordsTables = await discoverRecordsTables();
    for (const table of recordsTables) {
      const { rows, bytes } = await estimateTableSize(table);
      totalBytes += bytes;
    }
    
    const totalBytesLimit = DEFAULT_DB_LIMIT_MB * 1024 * 1024;
    const percentage = Math.min(100, (totalBytes / totalBytesLimit) * 100);
    
    return {
      used: totalBytes,
      total: totalBytesLimit,
      percentage,
      available: totalBytesLimit - totalBytes,
    };
  } catch (e) {
    return {
      used: 0,
      total: DEFAULT_DB_LIMIT_MB * 1024 * 1024,
      percentage: 0,
      available: DEFAULT_DB_LIMIT_MB * 1024 * 1024,
    };
  }
};

// Get storage usage metrics (file storage)
export const getStorageUsage = async (): Promise<StorageMetrics> => {
  try {
    // Supabase storage might not be accessible via client, estimate from data
    const dbMetrics = await getDatabaseUsage();
    const usedGB = dbMetrics.used / (1024 * 1024 * 1024);
    const totalGB = DEFAULT_STORAGE_LIMIT_GB;
    const percentage = Math.min(100, (usedGB / totalGB) * 100);
    
    return {
      used: Math.round(usedGB * 1024 * 1024 * 1024),
      total: totalGB * 1024 * 1024 * 1024,
      percentage,
      available: (totalGB - usedGB) * 1024 * 1024 * 1024,
    };
  } catch (e) {
    return {
      used: 0,
      total: DEFAULT_STORAGE_LIMIT_GB * 1024 * 1024 * 1024,
      percentage: 0,
      available: DEFAULT_STORAGE_LIMIT_GB * 1024 * 1024 * 1024,
    };
  }
};

// Get database health stats
export const getDatabaseHealth = async (): Promise<DatabaseStats> => {
  try {
    const tables = ["workbooks", "sheets", "columns", "users", "audit_logs"];
    let totalRows = 0;
    let largestTable = "";
    let largestTableRows = 0;
    
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });
      const rowCount = count || 0;
      totalRows += rowCount;
      
      if (rowCount > largestTableRows) {
        largestTableRows = rowCount;
        largestTable = table;
      }
    }
    
    // Add records tables
    const recordsTables = await discoverRecordsTables();
    for (const table of recordsTables) {
      const { rows } = await estimateTableSize(table);
      totalRows += rows;
      if (rows > largestTableRows) {
        largestTableRows = rows;
        largestTable = table;
      }
    }
    
    return {
      totalTables: tables.length + recordsTables.length,
      totalRows,
      largestTable,
      largestTableRows,
    };
  } catch (e) {
    return {
      totalTables: 0,
      totalRows: 0,
      largestTable: "unknown",
      largestTableRows: 0,
    };
  }
};

// Get module breakdown
export const getModuleBreakdown = async (): Promise<ModuleStats[]> => {
  const modules: ModuleStats[] = [];
  
  try {
    // Workbooks
    const { count: wbCount } = await supabase
      .from("workbooks")
      .select("*", { count: "exact", head: true });
    modules.push({
      module: "Workbooks",
      sizeBytes: (wbCount || 0) * 500,
      sizeFormatted: formatBytes((wbCount || 0) * 500),
      count: wbCount || 0,
    });
    
    // Sheets
    const { count: wsCount } = await supabase
      .from("sheets")
      .select("*", { count: "exact", head: true });
    modules.push({
      module: "Sheets",
      sizeBytes: (wsCount || 0) * 300,
      sizeFormatted: formatBytes((wsCount || 0) * 300),
      count: wsCount || 0,
    });
    
    // Audit Logs
    const { count: logCount } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true });
    modules.push({
      module: "Audit Logs",
      sizeBytes: (logCount || 0) * 250,
      sizeFormatted: formatBytes((logCount || 0) * 250),
      count: logCount || 0,
    });
    
    // Users
    const { count: userCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });
    modules.push({
      module: "Users",
      sizeBytes: (userCount || 0) * 500,
      sizeFormatted: formatBytes((userCount || 0) * 500),
      count: userCount || 0,
    });
    
    // Dashboard configs (localStorage)
    const dashAssignments = localStorage.getItem("dashboard_assignments");
    let dashCount = 0;
    if (dashAssignments) {
      try {
        const parsed = JSON.parse(dashAssignments);
        dashCount = Object.values(parsed).reduce((acc: number, widgets: any) => acc + (widgets?.length || 0), 0);
      } catch (e) {}
    }
    modules.push({
      module: "Dashboards",
      sizeBytes: dashCount * 100,
      sizeFormatted: formatBytes(dashCount * 100),
      count: dashCount,
    });
    
    // Temporary Files (localStorage cache)
    const keys = Object.keys(localStorage);
    const tempKeys = keys.filter(k => k.startsWith("local_rows_") || k.startsWith("sheet_table_map_") || k.startsWith("setting_"));
    modules.push({
      module: "Temporary Files",
      sizeBytes: tempKeys.length * 50,
      sizeFormatted: formatBytes(tempKeys.length * 50),
      count: tempKeys.length,
    });
    
    // Records (dynamic tables)
    const recordsTables = await discoverRecordsTables();
    let totalRecordBytes = 0;
    let totalRecordRows = 0;
    for (const table of recordsTables) {
      const { rows, bytes } = await estimateTableSize(table);
      totalRecordBytes += bytes;
      totalRecordRows += rows;
    }
    modules.push({
      module: "Imported Records",
      sizeBytes: totalRecordBytes,
      sizeFormatted: formatBytes(totalRecordBytes),
      count: totalRecordRows,
    });
    
    return modules.sort((a, b) => b.sizeBytes - a.sizeBytes);
  } catch (e) {
    return modules;
  }
};

// Get workbook analysis
export const getWorkbookAnalysis = async (): Promise<WorkbookAnalysis[]> => {
  try {
    const workbooks = await getWorkbooks();
    const analysis: WorkbookAnalysis[] = [];
    
    for (const wb of workbooks) {
      const { data: sheets, error } = await supabase
        .from("sheets")
        .select("id, name")
        .eq("workbook_id", wb.id);
      
      if (error) continue;
      
      const sheetCount = sheets?.length || 0;
      let totalRows = 0;
      
      for (const sheet of sheets || []) {
        // Try to count rows in the records table using resolved name
        const tableName = localStorage.getItem(`sheet_table_map_${sheet.id}`) || SHEET_TO_RECORD_TABLE[sheet.id];
        if (tableName) {
          try {
            const { count } = await supabase
              .from(tableName)
              .select("*", { count: "exact", head: true });
            totalRows += count || 0;
          } catch (e) {
            // Table might not exist, check localStorage
            const localRows = localStorage.getItem(`local_rows_${sheet.id}`);
            if (localRows) {
              try {
                const parsed = JSON.parse(localRows);
                totalRows += parsed.length || 0;
              } catch (e) {}
            }
          }
        } else {
          const localRows = localStorage.getItem(`local_rows_${sheet.id}`);
          if (localRows) {
            try {
              const parsed = JSON.parse(localRows);
              totalRows += parsed.length || 0;
            } catch (e) {}
          }
        }
      }
      
      // Estimate storage: sheets + rows
      const storageBytes = sheetCount * 300 + totalRows * 200;
      
      analysis.push({
        id: wb.id,
        name: wb.name,
        sheetCount,
        rowCount: totalRows,
        storageBytes,
        storageFormatted: formatBytes(storageBytes),
        lastModified: wb.updated_at || wb.created_at || null,
      });
    }
    
    return analysis.sort((a, b) => b.storageBytes - a.storageBytes);
  } catch (e) {
    return [];
  }
};

// Cleanup functions
export const cleanupAuditLogs = async (userId: string): Promise<void> => {
  localStorage.removeItem("local_audit_logs");
  try {
    await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  } catch (e) {}
};

export const cleanupTempFiles = async (): Promise<number> => {
  const keys = Object.keys(localStorage);
  let count = 0;
  keys.forEach((key) => {
    if (key.startsWith("sheet_table_map_") || key.startsWith("local_rows_") || key.startsWith("setting_")) {
      localStorage.removeItem(key);
      count++;
    }
  });
  return count;
};

export const cleanupOrphanedRecords = async (): Promise<void> => {
  try {
    // Get valid sheet IDs
    const { data: validSheets } = await supabase.from("sheets").select("id");
    const validSheetIds = new Set((validSheets || []).map((s: any) => s.id));
    
    // Check localStorage for orphaned entries
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("local_rows_")) {
        const sheetId = key.replace("local_rows_", "");
        if (!validSheetIds.has(sheetId)) {
          localStorage.removeItem(key);
        }
      }
    });
  } catch (e) {}
};

export const deleteEmptyWorkbooks = async (userId: string): Promise<number> => {
  try {
    const { data: workbooks } = await supabase.from("workbooks").select("id");
    let deleted = 0;
    
    for (const wb of workbooks || []) {
      const { data: sheets } = await supabase
        .from("sheets")
        .select("id")
        .eq("workbook_id", wb.id);
      
      if (!sheets || sheets.length === 0) {
        await supabase.from("workbooks").delete().eq("id", wb.id);
        deleted++;
      }
    }
    
    return deleted;
  } catch (e) {
    return 0;
  }
};

export const deleteTestWorkbooks = async (userId: string): Promise<number> => {
  try {
    const { data: workbooks } = await supabase.from("workbooks").select("id, name");
    let deleted = 0;
    
    for (const wb of workbooks || []) {
      if (wb.name?.toLowerCase().includes("test") || wb.name?.toLowerCase().includes("demo")) {
        await supabase.from("sheets").delete().eq("workbook_id", wb.id);
        await supabase.from("workbooks").delete().eq("id", wb.id);
        deleted++;
      }
    }
    
    return deleted;
  } catch (e) {
    return 0;
  }
};