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

async function testTrigger() {
  const sheetId = 127; // points to records_408e6806fae64721b6932558ec6d4664
  const tableName = 'records_408e6806fae64721b6932558ec6d4664';
  const columnName = 'test_col_trigger_xyz';

  console.log("1. Checking if we can insert column metadata...");
  // First, find display_order
  const colsRes = await fetch(`${supabaseUrl}/rest/v1/columns?sheet_id=eq.${sheetId}&order=display_order.desc&limit=1`, {
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  });
  const colsData = await colsRes.json();
  const nextOrder = colsData.length > 0 ? (colsData[0].display_order + 1) : 0;

  // Insert new column
  const insertRes = await fetch(`${supabaseUrl}/rest/v1/columns`, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      sheet_id: sheetId,
      name: columnName,
      inferred_type: 'text',
      display_order: nextOrder,
      is_hidden: false
    })
  });
  console.log("Insert status:", insertRes.status);
  const insertData = await insertRes.json();
  console.log("Insert result:", insertData);

  if (insertRes.status === 201) {
    console.log("2. Querying table to see if column exists in database schema...");
    const selectRes = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=${columnName}&limit=1`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    console.log("Select status:", selectRes.status);
    const selectData = await selectRes.json();
    console.log("Select result:", selectData);

    console.log("3. Deleting column metadata...");
    const deleteRes = await fetch(`${supabaseUrl}/rest/v1/columns?id=eq.${insertData[0].id}`, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    console.log("Delete status:", deleteRes.status);

    console.log("4. Verifying if column was dropped from database schema...");
    const selectAfterRes = await fetch(`${supabaseUrl}/rest/v1/${tableName}?select=${columnName}&limit=1`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    console.log("Select after delete status:", selectAfterRes.status);
    const selectAfterData = await selectAfterRes.json();
    console.log("Select after delete result:", selectAfterData);
  }
}

testTrigger().catch(console.error);
