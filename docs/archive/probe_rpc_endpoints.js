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
  'execute', 'query', 'run', 'sql', 'exec', 'execute_sql', 'run_sql', 'exec_sql',
  'eval', 'query_sql', 'raw_sql', 'db_query', 'database_query', 'run_command',
  'exec_command', 'exec_statement', 'execute_statement', 'query_statement',
  'exec_ddl', 'execute_ddl', 'run_ddl', 'alter_table', 'add_column', 'add_table_column'
];

async function probe() {
  for (const name of list) {
    const url = `${supabaseUrl}/rest/v1/rpc/${name}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: 'SELECT 1;', sql: 'SELECT 1;' })
      });
      console.log(`RPC ${name}: status = ${res.status}`);
      if (res.status !== 404) {
        const text = await res.text();
        console.log(`  Body: ${text}`);
      }
    } catch (err) {
      console.log(`RPC ${name} exception:`, err.message);
    }
  }
}

probe().catch(console.error);
