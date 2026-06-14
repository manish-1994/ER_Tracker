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

async function checkAssignments() {
  const { data, error } = await supabase.from('workspace_assignments').select('*');
  console.log("Assignments data:", data);
  console.log("Assignments error:", error);
}

checkAssignments().catch(console.error);
