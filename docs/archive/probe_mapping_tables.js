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

async function fetchFromSupabase(table) {
  const url = `${supabaseUrl}/rest/v1/${table}?select=*&limit=1`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    }
  });
  return response.status;
}

async function inspect() {
  const tables = [
    'sheet_mapping', 'sheet_mappings', 'worksheet_mapping', 'worksheet_mappings',
    'records_mapping', 'records_mappings', 'table_mapping', 'table_mappings',
    'worksheet_rows', 'column_metadata', 'audit_logs', 'permissions', 'role_permissions',
    'records', 'rows', 'sheet_records', 'worksheet_records'
  ];
  
  console.log('Probing mapping tables in Supabase...');
  for (const t of tables) {
    const status = await fetchFromSupabase(t);
    if (status === 200) {
      console.log(`  Table exists: ${t}`);
    } else {
      // console.log(`  Table ${t} does not exist (status ${status})`);
    }
  }
}

inspect();
