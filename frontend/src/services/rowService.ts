import { supabase } from "./supabaseClient";
import tableSchemas from "../../../supabase_table_schemas.json";
import { getColumns } from "./worksheetService";
import { sanitizeColumnName } from "../utils/sharedUtils";

const sanitizeCol = sanitizeColumnName;

const getPhysicalColumns = async (tableName: string): Promise<string[]> => {
  const staticCols = (tableSchemas as Record<string, string[]>)[tableName];
  if (staticCols && staticCols.length > 0) {
    return staticCols;
  }

  try {
    const { data } = await supabase.from(tableName).select("*").limit(1);
    if (data && data.length > 0) {
      return Object.keys(data[0]);
    }
  } catch {
    // ignore
  }
  return [];
};

const getHybridRows = (worksheetId: string): Record<string, Record<string, any>> => {
  try {
    const raw = localStorage.getItem(`hybrid_rows_${worksheetId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveHybridRows = (worksheetId: string, rows: Record<string, Record<string, any>>) => {
  try {
    localStorage.setItem(`hybrid_rows_${worksheetId}`, JSON.stringify(rows));
  } catch {
    // fail silently
  }
};


export type Row = {
  id: string;
  worksheet_id: string;
  data: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  deleted_by?: string;
};

export const SHEET_TO_RECORD_TABLE: Record<string, string> = {
  "3": "records_82788dc9238b480b8b4040caef236409",
  "5": "records_82788dc9238b480b8b4040caef236409",
  "7": "records_4059d22372a6457ba4b8129667a5ac54",
  "8": "records_e61aaaa26fd043a3a2d764df2aa14024",
  "9": "records_408e6806fae64721b6932558ec6d4664",
  "10": "records_2ea3533fbc444fd3a5b979639e38dbb7",
  "11": "records_e06051ec060f4c0d968275577903d11f",
  "12": "records_f054686c1cc947eb820ad9390ab36513",
  "13": "records_8194a89493c74d3ba83643fe34b5fea1",
  "14": "records_036fe570b67740bb8890ad60ffcfa25e",
  "15": "records_fd2763f2ba5a404f82b6c86ea86c3cff",
  "16": "records_6070970ff3bf42d0b68ee4cd28fb9060",
  "17": "records_01d6a3666c9f44dc90935215c53116d1",
  "18": "records_b84c776822e74b60b561e3248cba8633",
  "19": "records_cff7af7ed0394995a732cccabc486fbd",
  "20": "records_86cff3dade0e4ded9fbc557537b39019",
  "21": "records_c1b4d64899f24d128df55c8127d34c03",
  "22": "records_e34e3cc1f2c048498d4282392164466f",
  "23": "records_66b58351b75a4f0497478590cc12f7da",
  "126": "records_e61aaaa26fd043a3a2d764df2aa14024",
  "127": "records_408e6806fae64721b6932558ec6d4664",
  "128": "records_2ea3533fbc444fd3a5b979639e38dbb7",
  "129": "records_e06051ec060f4c0d968275577903d11f",
  "130": "records_f054686c1cc947eb820ad9390ab36513",
  "131": "records_8194a89493c74d3ba83643fe34b5fea1",
  "132": "records_036fe570b67740bb8890ad60ffcfa25e",
  "133": "records_fd2763f2ba5a404f82b6c86ea86c3cff",
  "134": "records_6070970ff3bf42d0b68ee4cd28fb9060",
  "135": "records_01d6a3666c9f44dc90935215c53116d1",
  "137": "records_cff7af7ed0394995a732cccabc486fbd",
  "138": "records_86cff3dade0e4ded9fbc557537b39019",
  "140": "records_e34e3cc1f2c048498d4282392164466f",
  "141": "records_66b58351b75a4f0497478590cc12f7da"
};

const KNOWN_RECORDS_TABLES = Object.values(SHEET_TO_RECORD_TABLE);

export const resolveRecordTable = async (sheetId: string): Promise<string> => {
  const cacheKey = `sheet_table_map_${sheetId}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const { data: sheet, error } = await supabase
      .from("sheets")
      .select("id, records_table_name")
      .eq("id", sheetId)
      .single();
      
    if (!error && sheet && sheet.records_table_name) {
      const actualTableName = sheet.records_table_name;
      localStorage.setItem(cacheKey, actualTableName);
      return actualTableName;
    }
  } catch {
    // ignore
  }

  const saveToDatabase = async (tableName: string) => {
    try {
      await supabase
        .from("sheets")
        .update({ records_table_name: tableName })
        .eq("id", sheetId);
    } catch {
      // ignore
    }
  };

  const { data: cols, error: colsErr } = await supabase
    .from("columns")
    .select("name")
    .eq("sheet_id", sheetId);

  if (colsErr || !cols || cols.length === 0) {
    if (SHEET_TO_RECORD_TABLE[sheetId]) {
      const actualTableName = SHEET_TO_RECORD_TABLE[sheetId];
      localStorage.setItem(cacheKey, actualTableName);
      await saveToDatabase(actualTableName);
      return actualTableName;
    }
    return `records_${sheetId}`;
  }

  const targetCols = cols.map(c => sanitizeCol(c.name)).filter(Boolean);
  if (targetCols.length === 0) {
    const actualTableName = SHEET_TO_RECORD_TABLE[sheetId] || `records_${sheetId}`;
    if (SHEET_TO_RECORD_TABLE[sheetId]) {
      await saveToDatabase(actualTableName);
    }
    return actualTableName;
  }

  const candidates = new Set(KNOWN_RECORDS_TABLES);
  const candidateList = Array.from(candidates);

  const columnsToTest = targetCols.join(",");
  let bestTable: string | null = null;

  const probePromises = candidateList.map(async (table) => {
    try {
      const { error, status } = await supabase.from(table).select(columnsToTest).limit(1);
      if (status === 200 && !error) {
        return { table, success: true };
      }
    } catch {
      // ignore
    }
    return { table, success: false };
  });

  const probeResults = await Promise.all(probePromises);
  const matched = probeResults.find(r => r.success);
  if (matched) {
    bestTable = matched.table;
  }

  if (bestTable) {
    localStorage.setItem(cacheKey, bestTable);
    await saveToDatabase(bestTable);
    return bestTable;
  }

  if (SHEET_TO_RECORD_TABLE[sheetId]) {
    const actualTableName = SHEET_TO_RECORD_TABLE[sheetId];
    await saveToDatabase(actualTableName);
    return actualTableName;
  }

  return `records_${sheetId}`;
};

/** Get rows for a worksheet - uses records_<worksheetId> table */
export const getRows = async (worksheetId: string): Promise<Row[]> => {
  const tableName = await resolveRecordTable(worksheetId);
  try {
    const { data, error, status } = await supabase
      .from(tableName)
      .select("*");
    if (error) {
      if (error.code === "42P01" || status === 404) {
        const localData = localStorage.getItem(`local_rows_${worksheetId}`);
        return localData ? JSON.parse(localData) : [];
      }
      return [];
    }

    const defaultValues: Record<string, any> = {};
    try {
      const { data: cols } = await supabase
        .from("columns")
        .select("name, inferred_type")
        .eq("sheet_id", parseInt(worksheetId));
      if (cols) {
        cols.forEach((col: any) => {
          const accessor = col.name.replace(/[^0-9a-zA-Z_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
          const parts = (col.inferred_type || "").split("|");
          let def = "";
          for (const p of parts) {
            if (p.startsWith("default:")) {
              def = p.substring(8);
            }
          }
          if (def) {
            if (def === "true") defaultValues[accessor] = true;
            else if (def === "false") defaultValues[accessor] = false;
            else if (!isNaN(Number(def)) && def.trim() !== "") defaultValues[accessor] = Number(def);
            else defaultValues[accessor] = def;
          }
        });
      }
    } catch {}

    const hybridRows = getHybridRows(worksheetId);

    return (data ?? []).map((row: any) => {
      const { id, created_at, updated_at, ...fields } = row;
      const localFields = hybridRows[String(id)] || {};
      return {
        id: String(id),
        worksheet_id: worksheetId,
        data: { ...defaultValues, ...fields, ...localFields },
        created_at,
        updated_at
      };
    });
  } catch {
    const localData = localStorage.getItem(`local_rows_${worksheetId}`);
    return localData ? JSON.parse(localData) : [];
  }
};

export const getRowsPaginated = async (
  worksheetId: string,
  page: number,
  pageSize: number
): Promise<{ rows: Row[]; total: number }> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const tableName = await resolveRecordTable(worksheetId);

  try {
    const { data, error, count, status } = await supabase
      .from(tableName)
      .select("*", { count: "exact" })
      .range(from, to);
    if (error) {
      if (error.code === "42P01" || status === 404) {
        const localKey = `local_rows_${worksheetId}`;
        const localData = localStorage.getItem(localKey);
        const allRows: Row[] = localData ? JSON.parse(localData) : [];
        const subset = allRows.slice(from, from + pageSize);
        return { rows: subset, total: allRows.length };
      }
      return { rows: [], total: 0 };
    }

    const defaultValues: Record<string, any> = {};
    try {
      const { data: cols } = await supabase
        .from("columns")
        .select("name, inferred_type")
        .eq("sheet_id", parseInt(worksheetId));
      if (cols) {
        cols.forEach((col: any) => {
          const accessor = col.name.replace(/[^0-9a-zA-Z_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
          const parts = (col.inferred_type || "").split("|");
          let def = "";
          for (const p of parts) {
            if (p.startsWith("default:")) {
              def = p.substring(8);
            }
          }
          if (def) {
            if (def === "true") defaultValues[accessor] = true;
            else if (def === "false") defaultValues[accessor] = false;
            else if (!isNaN(Number(def)) && def.trim() !== "") defaultValues[accessor] = Number(def);
            else defaultValues[accessor] = def;
          }
        });
      }
    } catch {}

    const hybridRows = getHybridRows(worksheetId);

    const mappedRows = (data ?? []).map((row: any) => {
      const { id, created_at, updated_at, ...fields } = row;
      const localFields = hybridRows[String(id)] || {};
      return {
        id: String(id),
        worksheet_id: worksheetId,
        data: { ...defaultValues, ...fields, ...localFields },
        created_at,
        updated_at
      };
    });

    return { rows: mappedRows, total: count ?? 0 };
  } catch {
    const localKey = `local_rows_${worksheetId}`;
    const localData = localStorage.getItem(localKey);
    const allRows: Row[] = localData ? JSON.parse(localData) : [];
    const subset = allRows.slice(from, from + pageSize);
    return { rows: subset, total: allRows.length };
  }
};


export const createRow = async (worksheetId: string, payload: any): Promise<Row> => {
  const tableName = await resolveRecordTable(worksheetId);

  try {
    const physicalCols = await getPhysicalColumns(tableName);

    const databasePayload: Record<string, any> = {};
    const hybridPayload: Record<string, any> = {};

    if (physicalCols.length > 0) {
      const systemCols = ["id", "created_at", "updated_at", "deleted_at", "deleted_by"];
      Object.keys(payload).forEach(key => {
        if (physicalCols.includes(key) || systemCols.includes(key)) {
          databasePayload[key] = payload[key];
        } else {
          hybridPayload[key] = payload[key];
        }
      });
    } else {
      Object.assign(databasePayload, payload);
    }

    const { data, error, status } = await supabase
      .from(tableName)
      .insert(databasePayload)
      .select()
      .single();

    if (error) {
      if (error.code === "42P01" || status === 404) {
        const localKey = `local_rows_${worksheetId}`;
        const localData = localStorage.getItem(localKey);
        const rows: Row[] = localData ? JSON.parse(localData) : [];
        const newRow: Row = {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          worksheet_id: worksheetId,
          data: payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        rows.push(newRow);
        localStorage.setItem(localKey, JSON.stringify(rows));
        return newRow;
      }
      throw error;
    }

    const { id, created_at, updated_at, ...fields } = data;

    if (Object.keys(hybridPayload).length > 0) {
      const hybridRows = getHybridRows(worksheetId);
      hybridRows[String(id)] = { ...(hybridRows[String(id)] || {}), ...hybridPayload };
      saveHybridRows(worksheetId, hybridRows);
    }

    return {
      id: String(id),
      worksheet_id: worksheetId,
      data: { ...fields, ...hybridPayload },
      created_at,
      updated_at
    };
  } catch {
    const localKey = `local_rows_${worksheetId}`;
    const localData = localStorage.getItem(localKey);
    const rows: Row[] = localData ? JSON.parse(localData) : [];
    const newRow: Row = {
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      worksheet_id: worksheetId,
      data: payload,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    rows.push(newRow);
    localStorage.setItem(localKey, JSON.stringify(rows));
    return newRow;
  }
};

export const createRowsBulk = async (worksheetId: string, payloads: any[]): Promise<Row[]> => {
  if (!payloads.length) return [];

  const tableName = await resolveRecordTable(worksheetId);

  try {
    const physicalCols = await getPhysicalColumns(tableName);

    const databasePayloads = payloads.map(p => {
      const dbPayload: Record<string, any> = {};
      if (physicalCols.length > 0) {
        const systemCols = ["id", "created_at", "updated_at", "deleted_at", "deleted_by"];
        Object.keys(p).forEach(key => {
          if (physicalCols.includes(key) || systemCols.includes(key)) {
            dbPayload[key] = p[key];
          }
        });
      } else {
        Object.assign(dbPayload, p);
      }
      return dbPayload;
    });

    const { data, error } = await supabase
      .from(tableName)
      .insert(databasePayloads)
      .select();

    if (error) {
      const results = await Promise.all(payloads.map(p => createRow(worksheetId, p)));
      return results;
    }

    const hybridRows = getHybridRows(worksheetId);
    let hasHybrid = false;

    const mappedRows = (data ?? []).map((row: any, idx: number) => {
      const { id, created_at, updated_at, ...fields } = row;
      const originalPayload = payloads[idx];

      const hybridPayload: Record<string, any> = {};
      if (physicalCols.length > 0 && originalPayload) {
        Object.keys(originalPayload).forEach(key => {
          if (!physicalCols.includes(key)) {
            hybridPayload[key] = originalPayload[key];
          }
        });
      }

      if (Object.keys(hybridPayload).length > 0) {
        hybridRows[String(id)] = { ...(hybridRows[String(id)] || {}), ...hybridPayload };
        hasHybrid = true;
      }

      return {
        id: String(id),
        worksheet_id: worksheetId,
        data: { ...fields, ...hybridPayload },
        created_at,
        updated_at
      };
    });

    if (hasHybrid) {
      saveHybridRows(worksheetId, hybridRows);
    }

    return mappedRows;
  } catch {
    const localKey = `local_rows_${worksheetId}`;
    const localData = localStorage.getItem(localKey);
    const existingRows: Row[] = localData ? JSON.parse(localData) : [];
    const newRows: Row[] = payloads.map(p => ({
      id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      worksheet_id: worksheetId,
      data: p,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    localStorage.setItem(localKey, JSON.stringify([...existingRows, ...newRows]));
    return newRows;
  }
};

export const updateRow = async (worksheetId: string, rowId: string, payload: any): Promise<Row> => {
  const tableName = await resolveRecordTable(worksheetId);

  try {
    const physicalCols = await getPhysicalColumns(tableName);

    const databasePayload: Record<string, any> = {};
    const hybridPayload: Record<string, any> = {};

    if (physicalCols.length > 0) {
      const systemCols = ["id", "created_at", "updated_at", "deleted_at", "deleted_by"];
      Object.keys(payload).forEach(key => {
        if (physicalCols.includes(key) || systemCols.includes(key)) {
          databasePayload[key] = payload[key];
        } else {
          hybridPayload[key] = payload[key];
        }
      });
    } else {
      Object.assign(databasePayload, payload);
    }

    let updatedDbRow: any = null;
    let dbError: any = null;
    let dbStatus: number | null = null;

    if (Object.keys(databasePayload).length > 0) {
      const { data, error, status } = await supabase
        .from(tableName)
        .update(databasePayload)
        .eq("id", rowId)
        .select()
        .single();
      updatedDbRow = data;
      dbError = error;
      dbStatus = status;
    } else {
      const { data, error, status } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", rowId)
        .single();
      updatedDbRow = data;
      dbError = error;
      dbStatus = status;
    }

    if (dbError) {
      if (dbError.code === "42P01" || dbStatus === 404 || rowId.startsWith("local_")) {
        const localKey = `local_rows_${worksheetId}`;
        const localData = localStorage.getItem(localKey);
        const rows: Row[] = localData ? JSON.parse(localData) : [];
        const idx = rows.findIndex(r => r.id === rowId);
        if (idx !== -1) {
          rows[idx].data = { ...rows[idx].data, ...payload };
          rows[idx].updated_at = new Date().toISOString();
          localStorage.setItem(localKey, JSON.stringify(rows));
          return rows[idx];
        }
        throw new Error("Local row not found");
      }
      throw dbError;
    }

    const hybridRows = getHybridRows(worksheetId);
    if (Object.keys(hybridPayload).length > 0) {
      hybridRows[String(rowId)] = { ...(hybridRows[String(rowId)] || {}), ...hybridPayload };
      saveHybridRows(worksheetId, hybridRows);
    }

    const { id, created_at, updated_at, ...fields } = updatedDbRow;
    const allLocalFields = hybridRows[String(rowId)] || {};

    return {
      id: String(id),
      worksheet_id: worksheetId,
      data: { ...fields, ...allLocalFields },
      created_at,
      updated_at
    };
  } catch {
    const localKey = `local_rows_${worksheetId}`;
    const localData = localStorage.getItem(localKey);
    const rows: Row[] = localData ? JSON.parse(localData) : [];
    const idx = rows.findIndex(r => r.id === rowId);
    if (idx !== -1) {
      rows[idx].data = { ...rows[idx].data, ...payload };
      rows[idx].updated_at = new Date().toISOString();
      localStorage.setItem(localKey, JSON.stringify(rows));
      return rows[idx];
    }
    throw new Error("Update failed");
  }
};

export const deleteRow = async (worksheetId: string, rowId: string): Promise<void> => {
  const tableName = await resolveRecordTable(worksheetId);
  try {
    const { error } = await supabase.from(tableName).update({
      deleted_at: new Date().toISOString(),
      deleted_by: rowId.startsWith("local_") ? "local_user" : null
    }).eq("id", rowId);

    if (error) {
      const hardDelete = await supabase.from(tableName).delete().eq("id", rowId);
      if (hardDelete.error) {
        if (hardDelete.error.code === "42P01" || hardDelete.error.code === "42703" || rowId.startsWith("local_")) {
          const localKey = `local_rows_${worksheetId}`;
          const localData = localStorage.getItem(localKey);
          if (localData) {
            const rows: Row[] = JSON.parse(localData);
            const updated = rows.filter(r => r.id !== rowId);
            localStorage.setItem(localKey, JSON.stringify(updated));
            return;
          }
        }
        throw error;
      }
    }
  } catch {
    const localKey = `local_rows_${worksheetId}`;
    const localData = localStorage.getItem(localKey);
    if (localData) {
      const rows: Row[] = JSON.parse(localData);
      const updated = rows.filter(r => r.id !== rowId);
      localStorage.setItem(localKey, JSON.stringify(updated));
      return;
    }
    throw new Error("Delete failed");
  }
};

/** Get column metadata for a worksheet to build card fields */
export const getRowCardFields = async (worksheetId: string): Promise<string[]> => {
  try {
    const cols = await getColumns(worksheetId);
    return cols.map(c => c.name);
  } catch {
    return [];
  }
};