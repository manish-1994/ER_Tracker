import sqlite3
import os

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

print(f"Found {len(sheets)} sheets and {len(records_tables)} records tables.")

print("\n--- EXACT MAPPINGS ---")
mapping_results = {}
for sheet in sheets:
    s_id, wb_id, s_name, row_count, col_count = sheet
    expected_cols = sheet_cols.get(s_id, [])
    
    # Normalize expected columns: replace non-alphanumeric with underscore to match SQL schema
    import re
    def _sanitize(col_name):
        sanitized = re.sub(r"[^0-9a-zA-Z_]", "_", col_name)
        sanitized = re.sub(r"_+", "_", sanitized)
        return sanitized.strip("_").lower()
    
    norm_expected = [_sanitize(c) for c in expected_cols]
    
    matches = []
    for t, t_columns in table_cols.items():
        norm_t_cols = [c.lower() for c in t_columns]
        
        # Check if they have exact match (case insensitive, normalized)
        if set(norm_expected) == set(norm_t_cols) and len(norm_expected) > 0:
            matches.append(t)
            
    if len(matches) == 1:
        print(f"Sheet ID {s_id} (Workbook {wb_id}, Name: '{s_name}') ==> {matches[0]}")
        mapping_results[s_id] = matches[0]
    elif len(matches) > 1:
        print(f"Sheet ID {s_id} (Workbook {wb_id}, Name: '{s_name}') ==> Multiple matches: {matches}")
    else:
        # Try substring or size matching
        partial_matches = []
        for t, t_columns in table_cols.items():
            norm_t_cols = [c.lower() for c in t_columns]
            intersection = set(norm_expected).intersection(set(norm_t_cols))
            if len(intersection) > 0:
                partial_matches.append((t, len(intersection)))
        partial_matches.sort(key=lambda x: x[1], reverse=True)
        if partial_matches:
            print(f"Sheet ID {s_id} (Workbook {wb_id}, Name: '{s_name}') ==> Partial match: {partial_matches[0][0]} ({partial_matches[0][1]} overlap)")
            mapping_results[s_id] = partial_matches[0][0]
        else:
            print(f"Sheet ID {s_id} (Workbook {wb_id}, Name: '{s_name}') ==> NO MATCH")

print("\n--- MAPPING CONSTANT DICTIONARY ---")
print("const SHEET_TO_RECORD_TABLE = {")
for s_id, t_name in sorted(mapping_results.items()):
    print(f"  {s_id}: '{t_name}',")
print("};")

conn.close()
