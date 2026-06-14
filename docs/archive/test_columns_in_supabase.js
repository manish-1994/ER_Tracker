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

const candidates = [
  'records_01d6a3666c9f44dc90935215c53116d1',
  'records_036fe570b67740bb8890ad60ffcfa25e',
  'records_2ea3533fbc444fd3a5b979639e38dbb7',
  'records_4059d22372a6457ba4b8129667a5ac54',
  'records_408e6806fae64721b6932558ec6d4664',
  'records_6070970ff3bf42d0b68ee4cd28fb9060',
  'records_66b58351b75a4f0497478590cc12f7da',
  'records_8194a89493c74d3ba83643fe34b5fea1',
  'records_82788dc9238b480b8b4040caef236409',
  'records_86cff3dade0e4ded9fbc557537b39019',
  'records_b84c776822e74b60b561e3248cba8633',
  'records_c1b4d64899f24d128df55c8127d34c03',
  'records_cff7af7ed0394995a732cccabc486fbd',
  'records_e06051ec060f4c0d968275577903d11f',
  'records_e34e3cc1f2c048498d4282392164466f',
  'records_e61aaaa26fd043a3a2d764df2aa14024',
  'records_f054686c1cc947eb820ad9390ab36513',
  'records_fd2763f2ba5a404f82b6c86ea86c3cff'
];

const targetCols = 'start_date,candidate,date_introduced,client,survey_completed';

async function run() {
  for (const table of candidates) {
    const url = `${envVars['VITE_SUPABASE_URL']}/rest/v1/${table}?select=${targetCols}&limit=1`;
    const res = await fetch(url, {
      headers: {
        'apikey': envVars['VITE_SUPABASE_ANON_KEY'],
        'Authorization': `Bearer ${envVars['VITE_SUPABASE_ANON_KEY']}`
      }
    });
    console.log(`Table: ${table} -> Status: ${res.status}`);
  }
}

run().catch(console.error);
