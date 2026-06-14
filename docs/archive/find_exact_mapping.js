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

    console.log('Fetching table schemas...');
    const tableSchemas = {};
    for (const t of recordsTables) {
      try {
        const rows = await fetchFromSupabase(t, 'select=*&limit=1');
        // PostgREST returns headers containing column keys, or if there is a row, we can get keys
        // Wait, if the table is empty, rows is [] and we won't get any keys.
        // Let's print table name and its row count first.
        // Let's see if we can get columns. In PostgREST, we can get columns via a select with a non-existent column,
        // or by trying to insert a dummy. But wait! If we do a select and it succeeds,
        // let's check if we can query some data.
        if (rows && rows.length > 0) {
          const cols = Object.keys(rows[0]).filter(k => k !== 'id');
          tableSchemas[t] = cols;
          console.log(`  ${t}: [${cols.join(', ')}]`);
        } else {
          // Empty table
          tableSchemas[t] = [];
          console.log(`  ${t}: (empty)`);
        }
      } catch (err) {
        console.error(`Error fetching ${t}:`, err.message);
      }
    }

    console.log('\n--- COMPARING COLUMN MATCHES ---');
    sheets.forEach(sheet => {
      const sheetCols = sheetColsMap[sheet.id] || [];
      console.log(`Sheet ID: ${sheet.id}, Name: "${sheet.name}"`);
      console.log(`  Expected columns:`, sheetCols);

      // Find matching table
      let bestMatch = null;
      let maxMatchCount = 0;
      
      for (const t of Object.keys(tableSchemas)) {
        const tableCols = tableSchemas[t];
        if (tableCols.length === 0) continue;
        
        // Calculate overlap
        const intersection = sheetCols.filter(c => tableCols.includes(c));
        if (intersection.length > maxMatchCount) {
          maxMatchCount = intersection.length;
          bestMatch = t;
        }
      }

      if (bestMatch && maxMatchCount > 0) {
        console.log(`  ==> BEST MATCH: ${bestMatch} (overlap: ${maxMatchCount}/${sheetCols.length} columns)`);
      } else {
        console.log(`  ==> NO MATCH FOUND`);
      }
    });

  } catch (err) {
    console.error('Failed:', err);
  }
}

inspect();
