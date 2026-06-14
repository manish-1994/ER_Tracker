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
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json();
}

async function inspect() {
  try {
    // 1. Workbooks
    console.log('--- WORKBOOKS ---');
    const workbooks = await fetchFromSupabase('workbooks');
    console.log(JSON.stringify(workbooks, null, 2));

    // 2. Sheets
    console.log('\n--- SHEETS ---');
    const sheets = await fetchFromSupabase('sheets');
    console.log(JSON.stringify(sheets, null, 2));

    // 3. Columns
    console.log('\n--- COLUMNS ---');
    const columns = await fetchFromSupabase('columns');
    console.log(JSON.stringify(columns, null, 2));

    // 4. Records tables sample data
    const recordsTables = [
      'records_4059d22372a6457ba4b8129667a5ac54',
      'records_70bf828b708643ceb924c8bd7bff7afb',
      'records_7a074755502f4c55883e81a95b31c75c',
      'records_8f52dd7434064cdf854dc53ca7fa7dd4',
      'records_9dcb6cf9a2ce4abb9d53d8f6368c8851',
      'records_a3aa340a29bc48b28d96406ffaecbd79',
      'records_a64fe89e13e34dd89f7c3f88c96fc46b',
      'records_b2657444a42c40f09851376d6f546daf',
      'records_c28baa0789df4a4a976582b2da10dbee',
      'records_edf9f773fa9f4291a79fc954cb181784',
      'records_efc6214fcf554d98b8dd2eeb0659964f'
    ];

    console.log('\n--- RECORDS TABLES SAMPLES ---');
    for (const t of recordsTables) {
      try {
        const rows = await fetchFromSupabase(t, 'select=*&limit=1');
        console.log(`Table: ${t}, Rows count in sample: ${rows.length}`);
        if (rows.length > 0) {
          console.log('Sample row fields:', Object.keys(rows[0]));
          console.log('Sample row data:', JSON.stringify(rows[0], null, 2));
        }
      } catch (err) {
        console.log(`Table: ${t} error:`, err.message);
      }
    }

  } catch (err) {
    console.error('Inspection failed:', err);
  }
}

inspect();
