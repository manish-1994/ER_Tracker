const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('app.db');

db.all("PRAGMA table_info(sheets)", [], (e, rows) => {
  console.log('sheets columns:', JSON.stringify(rows, null, 2));
});

db.all("PRAGMA table_info(columns)", [], (e, rows) => {
  console.log('columns columns:', JSON.stringify(rows, null, 2));
});

db.close();