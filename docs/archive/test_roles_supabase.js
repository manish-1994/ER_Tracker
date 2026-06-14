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
    envVars[key] = value;
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

async function inspectRoles() {
  // Query roles
  let res = await fetch(`${supabaseUrl}/rest/v1/roles?select=*`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  console.log("Roles status:", res.status);
  console.log("Roles data:", await res.json());

  // Query user_roles
  res = await fetch(`${supabaseUrl}/rest/v1/user_roles?select=*`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  console.log("User Roles status:", res.status);
  console.log("User Roles data:", await res.json());

  // Test join
  res = await fetch(`${supabaseUrl}/rest/v1/user_roles?select=role_id,roles(name)&limit=5`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  console.log("Join status:", res.status);
  console.log("Join data:", await res.json());
}

inspectRoles().catch(console.error);
