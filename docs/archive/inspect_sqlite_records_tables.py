import sqlite3

conn = sqlite3.connect('app.db')
cur = conn.cursor()

# Get all tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'records_%'")
records_tables = [r[0] for r in cur.fetchall()]

print(f"Total records tables in SQLite: {len(records_tables)}")
for t in sorted(records_tables):
    cur.execute(f"SELECT COUNT(*) FROM {t}")
    count = cur.fetchone()[0]
    cur.execute(f"PRAGMA table_info('{t}')")
    cols = [c[1] for c in cur.fetchall()]
    print(f"Table: {t}, Rows: {count}, Columns: {cols}")

conn.close()
