import sqlite3

conn = sqlite3.connect('app.db')
cur = conn.cursor()

# Get all sheets in creation order (by id)
cur.execute("SELECT id, workbook_id, name, col_count FROM sheets ORDER BY id ASC")
sheets = cur.fetchall()

# Get all records tables in creation order (sqlite_master order)
cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'records_%'")
records_tables = [r[0] for r in cur.fetchall()]

# Get columns for each sheet
cur.execute("SELECT sheet_id, name FROM columns ORDER BY sheet_id ASC, display_order ASC")
columns_raw = cur.fetchall()
sheet_cols = {}
for sheet_id, col_name in columns_raw:
    if sheet_id not in sheet_cols:
        sheet_cols[sheet_id] = []
    sheet_cols[sheet_id].append(col_name)

# Normalize names for comparison
import re
def _sanitize(col_name):
    sanitized = re.sub(r"[^0-9a-zA-Z_]", "_", col_name)
    sanitized = re.sub(r"_+", "_", sanitized)
    return sanitized.strip("_").lower()

print(f"Sheets: {len(sheets)}, Tables: {len(records_tables)}")

# Try to pair them
matched_count = 0
mapping_dict = {}

for idx, sheet in enumerate(sheets):
    s_id, wb_id, s_name, col_count = sheet
    if idx >= len(records_tables):
        print(f"Sheet ID {s_id} '{s_name}': No corresponding records table (index out of bounds)")
        continue
    
    t_name = records_tables[idx]
    
    # Get columns of the table
    cur.execute(f"PRAGMA table_info('{t_name}')")
    t_cols = [c[1] for c in cur.fetchall() if c[1] != 'id']
    
    s_cols = sheet_cols.get(s_id, [])
    norm_s_cols = [_sanitize(c) for c in s_cols]
    norm_t_cols = [c.lower() for c in t_cols]
    
    # Compare
    is_match = set(norm_s_cols) == set(norm_t_cols) and len(norm_s_cols) == len(norm_t_cols)
    if is_match:
        matched_count += 1
        mapping_dict[s_id] = t_name
        print(f"MATCH: Sheet {s_id} (Workbook {wb_id}, '{s_name}') <==> {t_name}")
    else:
        print(f"MISMATCH at index {idx}: Sheet {s_id} (Workbook {wb_id}, '{s_name}') has {len(norm_s_cols)} cols, but {t_name} has {len(norm_t_cols)} cols")
        print(f"  Sheet: {norm_s_cols}")
        print(f"  Table: {norm_t_cols}")

print(f"\nSuccessfully paired: {matched_count} / {len(sheets)}")

print("\nFull Mapping Javascript Map:")
print("const SHEET_TO_RECORD_TABLE = {")
for s_id, t_name in sorted(mapping_dict.items()):
    print(f"  {s_id}: '{t_name}',")
print("};")

conn.close()
