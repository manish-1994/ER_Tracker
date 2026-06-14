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
    const sheets = await fetchFromSupabase('sheets');
    console.log('SHEETS:');
    sheets.forEach(s => {
      console.log(`  ID: ${s.id}, WorkbookID: ${s.workbook_id}, Name: "${s.name}"`);
    });

    const columns = await fetchFromSupabase('columns');
    console.log('\nCOLUMNS SAMPLE (first 10):');
    columns.slice(0, 10).forEach(c => {
      console.log(`  ID: ${c.id}, SheetID: ${c.sheet_id}, Name: "${c.name}", DisplayOrder: ${c.display_order}`);
    });
    console.log(`Total Columns: ${columns.length}`);

  } catch (err) {
    console.error('Failed:', err);
  }
}

inspect();
