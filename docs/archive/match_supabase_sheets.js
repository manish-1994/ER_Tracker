const fs = require('fs');
const path = require('path');

// Parse .env
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

// Normalize helper
function sanitizeCol(colName) {
  return colName.replace(/[^0-9a-zA-Z_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

async function testSelect(table, cols) {
  const selectQuery = cols.map(c => sanitizeCol(c)).join(',');
  const url = `${supabaseUrl}/rest/v1/${table}?select=${selectQuery}&limit=1`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    return response.status === 200;
  } catch (e) {
    return false;
  }
}

// Read raw metadata
const metadataRaw = fs.readFileSync('live_metadata_utf8.json', 'utf8');
const parts = metadataRaw.split('--- ');
let sheets = [];
let columns = [];

for (const part of parts) {
  if (part.startsWith('SHEETS ---')) {
    const jsonStr = part.substring(part.indexOf('\n')).trim();
    sheets = JSON.parse(jsonStr);
  } else if (part.startsWith('COLUMNS ---')) {
    const jsonStr = part.substring(part.indexOf('\n')).split('---')[0].trim();
    columns = JSON.parse(jsonStr);
  }
}

const sheetColsMap = {};
columns.forEach(c => {
  if (!sheetColsMap[c.sheet_id]) {
    sheetColsMap[c.sheet_id] = [];
  }
  sheetColsMap[c.sheet_id].push(c.name);
});

async function run() {
  console.log(`Starting parallelized sheet to table mapping against ${recordsTables.length} tables...`);
  const mapping = {};
  
  const tasks = sheets.map(async (sheet) => {
    const cols = sheetColsMap[sheet.id] || [];
    if (cols.length === 0) {
      return;
    }
    
    // Check all tables in parallel for this sheet
    const checkPromises = recordsTables.map(async (table) => {
      const ok = await testSelect(table, cols);
      return { table, ok };
    });
    
    const results = await Promise.all(checkPromises);
    const matches = results.filter(r => r.ok).map(r => r.table);
    
    if (matches.length === 1) {
      mapping[sheet.id] = { sheetName: sheet.name, table: matches[0] };
    } else if (matches.length > 1) {
      mapping[sheet.id] = { sheetName: sheet.name, table: matches[0], notes: `Multiple matches: [${matches.join(', ')}]` };
    } else {
      mapping[sheet.id] = { sheetName: sheet.name, table: null };
    }
  });
  
  await Promise.all(tasks);
  
  console.log("\n--- SUPABASE MAPPING CONSTANT ---");
  console.log("const SHEET_TO_RECORD_TABLE = {");
  for (const sId of Object.keys(mapping).sort((a,b) => a-b)) {
    const item = mapping[sId];
    console.log(`  ${sId}: '${item.table}', // ${item.sheetName}${item.notes ? ' - ' + item.notes : ''}`);
  }
  console.log("};");
}

run().catch(console.error);
