const fs = require('fs');
try {
  const content = fs.readFileSync('mapping.txt', 'utf16le');
  fs.writeFileSync('mapping_utf8.txt', content, 'utf8');
  console.log("Converted mapping.txt to mapping_utf8.txt in UTF-8 format.");
} catch (e) {
  console.error("Conversion failed:", e);
}
