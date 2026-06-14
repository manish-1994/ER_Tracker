import sqlite3, json, os
db_path = os.path.join('d:\\','ER tracker Dashboard','app.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
tables = [row[0] for row in cur.fetchall()]
report = []
for table in tables:
    # columns
    cur.execute(f"PRAGMA table_info('{table}')")
    cols = [{"name": c[1], "type": c[2], "notnull": bool(c[3])} for c in cur.fetchall()]
    # primary keys
    cur.execute(f"PRAGMA table_info('{table}')")
    pk = [c[1] for c in cur.fetchall() if c[5]]
    # foreign keys
    cur.execute(f"PRAGMA foreign_key_list('{table}')")
    fks = [{"column": fk[3], "ref_table": fk[2], "ref_column": fk[4]} for fk in cur.fetchall()]
    # row count
    cur.execute(f"SELECT COUNT(*) FROM '{table}'")
    cnt = cur.fetchone()[0]
    report.append({"table": table, "columns": cols, "primary_keys": pk, "foreign_keys": fks, "row_count": cnt})
print(json.dumps(report, indent=2))