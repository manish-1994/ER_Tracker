import sqlite3, json, os

db_path = os.path.join('..', 'app.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

# Check if there's any table that maps sheet_id to records uuid
# Or if sheets has a uuid field we're missing

# Get ALL tables and their columns
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'")
all_tables = [r[0] for r in cur.fetchall()]

print("ALL TABLES AND THEIR COLUMNS:")
for t in sorted(all_tables):
    cur.execute(f"PRAGMA table_info('{t}')")
    cols = [c[1] for c in cur.fetchall()]
    print(f"  {t}: {cols}")

conn.close()