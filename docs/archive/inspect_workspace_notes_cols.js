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

const tables = [
  'users',
  'roles',
  'user_roles',
  'sheets',
  'workbooks',
  'workspace_assignments',
  'workspace_notes',
  'audit_logs'
];

async function inspect() {
  for (const table of tables) {
    const url = `${supabaseUrl}/rest/v1/${table}?select=*&limit=1`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Accept': 'application/json'
      }
    });
    console.log(`Table: ${table} -> Status: ${response.status}`);
    if (response.status !== 200) {
      const text = await response.text();
      console.log(`  Error: ${text}`);
    }
  }
}

inspect().catch(console.error);
