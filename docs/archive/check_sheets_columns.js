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

const url = `${envVars['VITE_SUPABASE_URL']}/rest/v1/sheets?select=id,name`;
fetch(url, {
  headers: {
    'apikey': envVars['VITE_SUPABASE_ANON_KEY'],
    'Authorization': `Bearer ${envVars['VITE_SUPABASE_ANON_KEY']}`
  }
})
.then(r => r.json())
.then(data => {
  console.log('Sheets columns:', data);
})
.catch(console.error);
