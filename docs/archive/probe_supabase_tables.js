const fs = require('fs');
const path = require('path');

// Parse .env file
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

async function fetchFromSupabase(table) {
  const url = `${supabaseUrl}/rest/v1/${table}?select=*&limit=1`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  const text = await response.text();
  return { status: response.status, body: text };
}

async function inspect() {
  // We probe table names starting with different hex characters to trigger PostgREST's suggestions
  const hexChars = '0123456789abcdef';
  const foundTables = new Set();
  
  for (const c of hexChars) {
    const probeName = `records_${c}`;
    try {
      const res = await fetchFromSupabase(probeName);
      if (res.status === 404) {
        try {
          const parsed = JSON.parse(res.body);
          if (parsed.hint && parsed.hint.includes("Perhaps you meant the table")) {
            const match = parsed.hint.match(/'public\.(records_[a-f0-9]+)'/);
            if (match) {
              foundTables.add(match[1]);
            }
          }
        } catch (e) {
          // ignore parse error
        }
      }
    } catch (err) {
      console.error(`Error probing ${probeName}:`, err.message);
    }
  }

  // Also probe with full uuids from sqlite to see if they exist in Supabase
  const sqliteTables = [
    'records_48b55739782c4ebca88a28207541c214',
    'records_5056c2bef60f4ec0b26292dd9be76442',
    'records_50ad41648cd8408f8ec36ff544db1a9c',
    'records_558afc75d0184b129f8181215550616e',
    'records_592da5f6ad2c4e819f534c5b4619ae36',
    'records_59d9ada377d541a6ac9a5acd07e91f2e',
    'records_5c2f8d29d71a409fa3c7f676e0c71068',
    'records_5df946fe559b4d6288016557a242f8c9',
    'records_6c57cf589615467a8ec9665631660709',
    'records_6eeaab453584438cb02e4d81b9f98d35',
    'records_70bf828b708643ceb924c8bd7bff7afb',
    'records_78fd31d4749d4f6d911d5030a2cf49ae',
    'records_7a074755502f4c55883e81a95b31c75c',
    'records_80dc67a666914aa286398662a067e836',
    'records_8e662f2acbc4449a85f9dd977ac3b0b8',
    'records_8f52dd7434064cdf854dc53ca7fa7dd4',
    'records_95616ece69de4574b0f9a874a0e16066',
    'records_97513e6c9cd145c8b82e4c35ec9ac70a',
    'records_9acef7ccf6834f3da9367e605ef13c75',
    'records_9dcb6cf9a2ce4abb9d53d8f6368c8851',
    'records_9ec25de991664a54a0af15e6b60c38b5',
    'records_a3aa340a29bc48b28d96406ffaecbd79',
    'records_a3dc33016ba3412eb6e5a5c8e8124342',
    'records_a64fe89e13e34dd89f7c3f88c96fc46b',
    'records_b2657444a42c40f09851376d6f546daf',
    'records_b5cb0f5f73b845a081253e455a2a187a',
    'records_bb2f8ae869d5420593e543a08f92f45c',
    'records_bc870ab9253f4a348e730be9db93f816',
    'records_bccfc721b36c413a9c16c77f61e60edd',
    'records_c28baa0789df4a4a976582b2da10dbee',
    'records_dcbb7745275245bb9df29070f22d0844',
    'records_ddf889b1f2bb4ab5bb2c0f4a45cd87ff',
    'records_e2f27b0a60994ba8a1e4d7347396d862',
    'records_e5d25ca296c245c9a9a1b195f0645b00',
    'records_e734799e27b64be7861dd8c2343b4861',
    'records_e7bd2c7ea69c47ebac0ec52f70ce54c3',
    'records_eb31f43c5fd54365bc919b4a0449f929',
    'records_edf9f773fa9f4291a79fc954cb181784',
    'records_efc6214fcf554d98b8dd2eeb0659964f',
    'records_f65c18a86d274b6eba63ed7778c03296',
    'records_f86756e641e5442a9687f18dd8f40378',
    'records_ff5c07ffa1a44032bd2023d3905620bf'
  ];

  for (const t of sqliteTables) {
    try {
      const res = await fetchFromSupabase(t);
      if (res.status === 200) {
        foundTables.add(t);
      } else if (res.status === 404) {
        try {
          const parsed = JSON.parse(res.body);
          if (parsed.hint && parsed.hint.includes("Perhaps you meant the table")) {
            const match = parsed.hint.match(/'public\.(records_[a-f0-9]+)'/);
            if (match) {
              foundTables.add(match[1]);
            }
          }
        } catch (e) {
          // ignore
        }
      }
    } catch (err) {
      // ignore
    }
  }

  console.log('\n--- FOUND RECORDS TABLES IN SUPABASE ---');
  console.log(Array.from(foundTables).sort());
}

inspect();
