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

async function run() {
  const url = `${envVars['VITE_SUPABASE_URL']}/rest/v1/records_82788dc9238b480b8b4040caef236409?select=*&limit=1`;
  const res = await fetch(url, {
    headers: {
      'apikey': envVars['VITE_SUPABASE_ANON_KEY'],
      'Authorization': `Bearer ${envVars['VITE_SUPABASE_ANON_KEY']}`
    }
  });
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Row sample:', data);
}

run().catch(console.error);
