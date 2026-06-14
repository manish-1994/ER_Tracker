const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const ws = require('ws');
global.WebSocket = ws;
const { createClient } = require('@supabase/supabase-js');

// Parse .env file
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
      value = value.substring(1, value.length - 1);
    }
    envVars[key] = value.trim();
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SHEET_TO_RECORD_TABLE = {
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
  "23": "records_66b58351b75a4f0497478590cc12f7da"
};

const KNOWN_RECORDS_TABLES = Object.values(SHEET_TO_RECORD_TABLE);

function sanitizeCol(colName) {
  return colName.replace(/[^0-9a-zA-Z_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

async function resolveRecordTable(sheetId, targetCols) {
  // If the columns metadata is missing, check if sheetId is mapped baseline
  if (targetCols.length === 0) {
    if (SHEET_TO_RECORD_TABLE[sheetId]) return SHEET_TO_RECORD_TABLE[sheetId];
    return `records_${sheetId}`;
  }

  const candidateList = Array.from(new Set(KNOWN_RECORDS_TABLES));
  const columnsToTest = targetCols.map(sanitizeCol).join(",");
  let bestTable = null;

  const probePromises = candidateList.map(async (table) => {
    try {
      const { error, status } = await supabase.from(table).select(columnsToTest).limit(1);
      if (status === 200 && !error) {
        return { table, success: true };
      }
    } catch (e) {
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
    return bestTable;
  }

  if (SHEET_TO_RECORD_TABLE[sheetId]) {
    return SHEET_TO_RECORD_TABLE[sheetId];
  }

  return `records_${sheetId}`;
}

const getColLetter = (n) => {
  let letter = "";
  while (n >= 0) {
    letter = String.fromCharCode((n % 26) + 65) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
};

const getHeaderName = (colVal, idx, allEmpty) => {
  if (allEmpty) {
    return `Column ${getColLetter(idx)}`;
  }
  const valStr = String(colVal || '').trim();
  if (!valStr) {
    return `Unnamed: ${idx + 1}`;
  }
  return valStr;
};

async function run() {
  const filePath = path.join(__dirname, '../tmp/2eb68bcb-032c-45a3-8021-c99120c25f72.xlsx');
  console.log("Reading workbook:", filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });

  console.log("Sheet names found:", workbook.SheetNames);
  
  // Ingest into a new workbook record
  console.log("Creating new workbook in database...");
  const { data: wbRecord, error: wbErr } = await supabase
    .from("workbooks")
    .insert({ name: "ER - Weekly Update Sheet.xlsx" })
    .select()
    .single();

  if (wbErr) {
    console.error("Failed to create workbook:", wbErr);
    return;
  }
  console.log("Created workbook:", wbRecord);

  for (let i = 0; i < workbook.SheetNames.length; i++) {
    const sheetName = workbook.SheetNames[i];
    const ws = workbook.Sheets[sheetName];
    const jsonRows = XLSX.utils.sheet_to_json(ws, { header: 1 });
    if (jsonRows.length === 0) {
      console.log(`Sheet "${sheetName}" is empty, skipping.`);
      continue;
    }

    console.log(`Ingesting sheet: "${sheetName}" (${jsonRows.length} rows including headers)...`);
    const { data: wsRecord, error: wsErr } = await supabase
      .from("sheets")
      .insert({ workbook_id: wbRecord.id, name: sheetName })
      .select()
      .single();

    if (wsErr) {
      console.error(`Failed to create worksheet for "${sheetName}":`, wsErr);
      continue;
    }
    console.log(`Created sheet "${sheetName}" with ID ${wsRecord.id}`);

    const headerRow = jsonRows[0] || [];
    const allEmpty = headerRow.length === 0 || headerRow.every(val => val === null || val === undefined || String(val).trim() === "");
    const processedHeaders = headerRow.map((col, idx) => getHeaderName(col, idx, allEmpty));

    console.log(`Inserting columns:`, processedHeaders);
    const columnPromises = processedHeaders.map((colName, idx) => {
      return supabase.from("columns").insert({
        sheet_id: wsRecord.id,
        name: colName,
        inferred_type: "text",
        is_hidden: false,
        display_order: idx,
      });
    });
    await Promise.all(columnPromises);

    // Resolve record table for this worksheet
    const tableName = await resolveRecordTable(wsRecord.id, processedHeaders);
    console.log(`Resolved records table for sheet "${sheetName}": [${tableName}]`);

    // Write back to database sheets table to persist the resolved table
    const { error: updateErr } = await supabase
      .from("sheets")
      .update({ records_table_name: tableName })
      .eq("id", wsRecord.id);
    if (updateErr) {
      console.error(`Failed to update records_table_name for sheet "${sheetName}":`, updateErr);
    }

    let successRows = 0;
    let failedRows = 0;
    let sampleFail = null;

    for (let r = 1; r < jsonRows.length; r++) {
      const rowVals = jsonRows[r] || [];
      const rowData = {};
      processedHeaders.forEach((col, idx) => {
        const sanitizedKey = sanitizeCol(col);
        rowData[sanitizedKey] = rowVals[idx] !== undefined && rowVals[idx] !== null ? rowVals[idx] : "";
      });

      // Try inserting
      const { data, error } = await supabase
        .from(tableName)
        .insert(rowData)
        .select();

      if (error) {
        failedRows++;
        if (!sampleFail) {
          sampleFail = { error, payload: rowData };
        }
      } else {
        successRows++;
      }
    }

    console.log(`Sheet "${sheetName}" finished: ${successRows} succeeded, ${failedRows} failed.`);
    if (failedRows > 0) {
      console.log(`  Sample failure error:`, JSON.stringify(sampleFail.error, null, 2));
      console.log(`  Sample failure payload keys:`, Object.keys(sampleFail.payload));
    }
  }
}

run().catch(console.error);
