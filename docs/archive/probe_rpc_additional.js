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

const list = [
  'query_db', 'execute_query', 'run_query', 'exec_query', 'postgres_query',
  'pg_query', 'raw_query', 'execute_ddl', 'alter_table', 'add_column',
  'alter_records_table', 'add_records_column', 'add_column_to_table',
  'exec_raw_sql', 'execute_raw_sql', 'run_raw_sql'
];

async function probe() {
  for (const name of list) {
    for (const param of ['query', 'sql', 'sql_string', 'cmd', 'command', 'stmt', 'statement']) {
      const url = `${supabaseUrl}/rest/v1/rpc/${name}`;
      try {
        const body = { [param]: 'SELECT 1;' };
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        if (res.status !== 404) {
          const text = await res.text();
          console.log(`RPC ${name}(${param}): status = ${res.status}, body = ${text}`);
        }
      } catch (err) {
        // ignore
      }
    }
  }
}

probe().catch(console.error);
