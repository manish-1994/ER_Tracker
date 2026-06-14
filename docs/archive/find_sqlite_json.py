import sqlite3
import json
import re

conn = sqlite3.connect('app.db')
cur = conn.cursor()

# Get all records tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'records_%'")
records_tables = [r[0] for r in cur.fetchall()]

# Get all sheets
cur.execute("SELECT id, workbook_id, name, row_count, col_count FROM sheets")
sheets = cur.fetchall()

# Get all columns grouped by sheet_id
cur.execute("SELECT id, sheet_id, name, display_order FROM columns")
columns_raw = cur.fetchall()
sheet_cols = {}
for c_id, sheet_id, col_name, order in columns_raw:
    if sheet_id not in sheet_cols:
        sheet_cols[sheet_id] = []
    sheet_cols[sheet_id].append(col_name)

# Get columns for each records table
table_cols = {}
for t in records_tables:
    cur.execute(f"PRAGMA table_info('{t}')")
    cols = [c[1] for c in cur.fetchall() if c[1] != 'id']
    table_cols[t] = cols

def _sanitize(col_name):
    sanitized = re.sub(r"[^0-9a-zA-Z_]", "_", col_name)
    sanitized = re.sub(r"_+", "_", sanitized)
    return sanitized.strip("_").lower()

mapping_results = {}
for sheet in sheets:
    s_id, wb_id, s_name, row_count, col_count = sheet
    expected_cols = sheet_cols.get(s_id, [])
    norm_expected = [_sanitize(c) for c in expected_cols]
    
    matches = []
    for t, t_columns in table_cols.items():
        norm_t_cols = [c.lower() for c in t_columns]
        if set(norm_expected) == set(norm_t_cols) and len(norm_expected) > 0:
            matches.append(t)
            
    if len(matches) == 1:
        mapping_results[s_id] = matches[0]
    else:
        # Try overlap matching
        partial_matches = []
        for t, t_columns in table_cols.items():
            norm_t_cols = [c.lower() for c in t_columns]
            intersection = set(norm_expected).intersection(set(norm_t_cols))
            if len(intersection) > 0:
                partial_matches.append((t, len(intersection)))
        partial_matches.sort(key=lambda x: x[1], reverse=True)
        if partial_matches:
            mapping_results[s_id] = partial_matches[0][0]

with open('mapping.json', 'w', encoding='utf-8') as f:
    json.dump(mapping_results, f, indent=2)

print(f"Mapped {len(mapping_results)} sheets.")
conn.close()
