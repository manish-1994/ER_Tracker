const fs = require('fs');

const metadataRaw = fs.readFileSync('live_metadata_utf8.json', 'utf8');
const parts = metadataRaw.split('--- ');
let columns = [];

for (const part of parts) {
  if (part.startsWith('COLUMNS ---')) {
    const jsonStr = part.substring(part.indexOf('\n')).split('---')[0].trim();
    columns = JSON.parse(jsonStr);
  }
}

const sheet_18_cols = columns.filter(c => c.sheet_id === 18);
console.log("Sheet 18 columns in Supabase:", sheet_18_cols);
