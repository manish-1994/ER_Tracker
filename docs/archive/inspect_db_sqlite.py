import sqlite3
import os

conn = sqlite3.connect('app.db')
cur = conn.cursor()

print("--- SHEETS IN sqlite app.db ---")
cur.execute("SELECT * FROM sheets")
sheets = cur.fetchall()
cur.execute("PRAGMA table_info(sheets)")
sheet_cols = [c[1] for c in cur.fetchall()]
print("Columns:", sheet_cols)
for s in sheets:
    print(dict(zip(sheet_cols, s)))

print("\n--- COLUMNS IN sqlite app.db ---")
cur.execute("SELECT * FROM columns LIMIT 5")
cols = cur.fetchall()
cur.execute("PRAGMA table_info(columns)")
col_cols = [c[1] for c in cur.fetchall()]
print("Columns:", col_cols)
for c in cols:
    print(dict(zip(col_cols, c)))

print("\n--- WORKBOOKS IN sqlite app.db ---")
cur.execute("SELECT * FROM workbooks")
workbooks = cur.fetchall()
cur.execute("PRAGMA table_info(workbooks)")
wb_cols = [c[1] for c in cur.fetchall()]
print("Columns:", wb_cols)
for w in workbooks:
    print(dict(zip(wb_cols, w)))

conn.close()
