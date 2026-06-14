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

async function probe() {
  const endpoints = [
    'information_schema/tables',
    'information_schema/columns',
    'information_schema/triggers',
    'pg_catalog/pg_proc',
    'pg_catalog/pg_trigger'
  ];
  for (const ep of endpoints) {
    const url = `${supabaseUrl}/rest/v1/${ep}?limit=1`;
    try {
      const res = await fetch(url, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      console.log(`Endpoint ${ep}: status = ${res.status}`);
      if (res.status === 200) {
        const json = await res.json();
        console.log(`  Sample:`, json);
      }
    } catch (err) {
      console.log(`Endpoint ${ep} exception:`, err.message);
    }
  }
}

probe().catch(console.error);
