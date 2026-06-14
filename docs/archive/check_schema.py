import sqlite3, json, os
db_path = os.path.join('..', 'app.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Get sheets schema
cur.execute("PRAGMA table_info('sheets')")
print("SHEETS COLUMNS:", [c[1] for c in cur.fetchall()])

# Get columns schema  
cur.execute("PRAGMA table_info('columns')")
print("COLUMNS FIELDS:", [c[1] for c in cur.fetchall()])

# Check for records tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'records_%'")
print("RECORDS TABLES:", [r[0] for r in cur.fetchall()])

conn.close()