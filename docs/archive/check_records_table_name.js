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
  return { status: response.status, body: await response.text() };
}

async function inspect() {
  try {
    console.log('Querying select=id,records_table_name from sheets...');
    const res = await fetchFromSupabase('sheets', 'select=id,records_table_name');
    console.log('Status:', res.status);
    console.log('Response:', res.body);
  } catch (err) {
    console.error('Failed:', err);
  }
}

inspect();
