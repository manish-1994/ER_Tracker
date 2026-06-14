const fs = require('fs');

try {
  const content = fs.readFileSync('live_metadata.json', 'utf16le');
  // It starts with BOM sometimes, strip it if present
  const clean = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
  fs.writeFileSync('live_metadata_utf8.json', clean, 'utf8');
  console.log("Successfully converted to live_metadata_utf8.json");
} catch (e) {
  console.error("Error converting:", e);
}
