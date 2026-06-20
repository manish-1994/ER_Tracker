import { supabase } from "./supabaseClient";

const REQUIRED_TABLES = [
  "users",
  "roles", 
  "user_roles",
  "workbooks",
  "sheets",
  "columns",
  "workspace_assignments"
];

export const validateSchema = async () => {
  console.log("[SCHEMA] Validating required tables...");
  const results: Record<string, { exists: boolean; error?: string }> = {};
  
  for (const table of REQUIRED_TABLES) {
    try {
      const { error } = await supabase.from(table).select("*").limit(1);
      if (error) {
        results[table] = { exists: false, error: error.message };
        console.log(`[SCHEMA] ✗ ${table} - NOT FOUND:`, error.message);
      } else {
        results[table] = { exists: true };
        console.log(`[SCHEMA] ✓ ${table}`);
      }
    } catch (e: any) {
      results[table] = { exists: false, error: e.message || String(e) };
      console.log(`[SCHEMA] ✗ ${table} - ERROR:`, e.message);
    }
  }
  
  return results;
};

export const getMissingTables = (validationResults: Record<string, { exists: boolean; error?: string }>) => {
  return Object.entries(validationResults)
    .filter(([_, result]) => !result.exists)
    .map(([table]) => table);
};