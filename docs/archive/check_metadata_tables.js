const fs = require('fs');
const path = require('path');

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
    envVars[key] = value.trim();
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

async function check() {
  const tables = ['column_metadata', 'worksheet_rows', 'columns', 'sheets'];
  for (const t of tables) {
    const url = `${supabaseUrl}/rest/v1/${t}?limit=1`;
    try {
      const res = await fetch(url, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      console.log(`Table ${t}: status = ${res.status}`);
      if (res.status === 200) {
        const json = await res.json();
        console.log(`  Sample:`, json);
      }
    } catch (e) {
      console.log(`Table ${t} exception:`, e.message);
    }
  }
}

check().catch(console.error);
