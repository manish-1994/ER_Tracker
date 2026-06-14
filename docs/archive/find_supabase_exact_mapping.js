const fs = require('fs');
const path = require('path');

// Parse .env file
const envPath = path.join(__dirname, 'frontend', '.env');
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
    envVars[key] = value;
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

async function checkColumnInTable(table, colName) {
  const url = `${supabaseUrl}/rest/v1/${table}?select=${colName}&limit=1`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  return response.status === 200;
}

async function fetchFromSupabase(table, query = 'select=*') {
  const url = `${supabaseUrl}/rest/v1/${table}?${query}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json();
}

const recordsTables = [
  'records_01d6a3666c9f44dc90935215c53116d1',
  'records_036fe570b67740bb8890ad60ffcfa25e',
  'records_2ea3533fbc444fd3a5b979639e38dbb7',
  'records_4059d22372a6457ba4b8129667a5ac54',
  'records_408e6806fae64721b6932558ec6d4664',
  'records_6070970ff3bf42d0b68ee4cd28fb9060',
  'records_66b58351b75a4f0497478590cc12f7da',
  'records_8194a89493c74d3ba83643fe34b5fea1',
  'records_82788dc9238b480b8b4040caef236409',
  'records_86cff3dade0e4ded9fbc557537b39019',
  'records_b84c776822e74b60b561e3248cba8633',
  'records_c1b4d64899f24d128df55c8127d34c03',
  'records_cff7af7ed0394995a732cccabc486fbd',
  'records_e06051ec060f4c0d968275577903d11f',
  'records_e34e3cc1f2c048498d4282392164466f',
  'records_e61aaaa26fd043a3a2d764df2aa14024',
  'records_f054686c1cc947eb820ad9390ab36513',
  'records_fd2763f2ba5a404f82b6c86ea86c3cff'
];

// Normalize/sanitize column name helper
function sanitizeCol(colName) {
  return colName.replace(/[^0-9a-zA-Z_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
}

async function inspect() {
  try {
    const sheets = await fetchFromSupabase('sheets');
    const columns = await fetchFromSupabase('columns');

    // Group columns by sheet_id
    const sheetColsMap = {};
    columns.forEach(c => {
      if (!sheetColsMap[c.sheet_id]) {
        sheetColsMap[c.sheet_id] = [];
      }
      sheetColsMap[c.sheet_id].push(c.name);
    });

    console.log('Mapping sheets by probing unique columns...');
    const mappingResults = {};
    
    for (const sheet of sheets) {
      const sCols = sheetColsMap[sheet.id] || [];
      if (sCols.length === 0) {
        console.log(`Sheet ID ${sheet.id} '${sheet.name}': has no columns in columns table.`);
        continue;
      }
      
      // Let's use the first non-id column as our probe
      const probeCol = sanitizeCol(sCols[0]);
      console.log(`Probing sheet ID ${sheet.id} '${sheet.name}' using column '${probeCol}'...`);
      
      const matchedTables = [];
      for (const t of recordsTables) {
        try {
          const hasCol = await checkColumnInTable(t, probeCol);
          if (hasCol) {
            matchedTables.push(t);
          }
        } catch (err) {
          // ignore
        }
      }
      
      if (matchedTables.length === 1) {
        console.log(`  ==> MATCH: ${matchedTables[0]}`);
        mappingResults[sheet.id] = matchedTables[0];
      } else if (matchedTables.length > 1) {
        // If multiple tables match the first column, let's probe all columns
        console.log(`  ==> Multiple tables matched '${probeCol}': [${matchedTables.join(', ')}]. Refining...`);
        const refinedMatches = [];
        for (const t of matchedTables) {
          let allMatch = true;
          // check up to 3 columns to narrow down
          for (let i = 0; i < Math.min(3, sCols.length); i++) {
            const nextCol = sanitizeCol(sCols[i]);
            const hasNext = await checkColumnInTable(t, nextCol);
            if (!hasNext) {
              allMatch = false;
              break;
            }
          }
          if (allMatch) {
            refinedMatches.push(t);
          }
        }
        if (refinedMatches.length === 1) {
          console.log(`    ==> REFINED MATCH: ${refinedMatches[0]}`);
          mappingResults[sheet.id] = refinedMatches[0];
        } else {
          console.log(`    ==> AMBIGUOUS MATCH: [${refinedMatches.join(', ')}]`);
        }
      } else {
        console.log(`  ==> NO MATCH FOUND`);
      }
    }

    console.log('\n--- SUPABASE MAPPING CONSTANT ---');
    console.log('const SHEET_TO_RECORD_TABLE = {');
    for (const s_id of Object.keys(mappingResults).sort((a,b) => a-b)) {
      console.log(`  ${s_id}: '${mappingResults[s_id]}',`);
    }
    console.log('};');

  } catch (err) {
    console.error('Failed:', err);
  }
}

inspect();
