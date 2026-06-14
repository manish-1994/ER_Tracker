const fs = require('fs');
const path = require('path');
const ws = require('ws');
global.WebSocket = ws;
const { createClient } = require('@supabase/supabase-js');

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
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testRpc() {
  const query = `
    CREATE TABLE IF NOT EXISTS public.workspace_notes (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        workbook_id BIGINT REFERENCES public.workbooks(id) ON DELETE CASCADE,
        sheet_id BIGINT REFERENCES public.sheets(id) ON DELETE CASCADE,
        assignment_id BIGINT REFERENCES public.workspace_assignments(id) ON DELETE CASCADE,
        record_id TEXT,
        is_private BOOLEAN DEFAULT FALSE,
        title TEXT,
        content TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  
  const rpcNames = ['exec_sql', 'run_sql', 'execute_sql', 'query', 'sql'];
  for (const name of rpcNames) {
    try {
      console.log(`Testing RPC: ${name}...`);
      const { data, error } = await supabase.rpc(name, { query: query, sql: query });
      console.log(`  Result for ${name}:`, { data, error });
    } catch (e) {
      console.log(`  Exception for ${name}:`, e.message);
    }
  }
}

testRpc().catch(console.error);
