import json

with open('live_metadata_utf8.json', 'r', encoding='utf-8') as f:
    text = f.read()

# The file contains sections:
# --- WORKBOOKS ---
# [json]
# --- SHEETS ---
# [json]
# --- COLUMNS ---
# [json]
# --- RECORDS TABLES SAMPLES ---
# ...

parts = text.split('--- ')
workbooks = []
sheets = []
columns = []

for part in parts:
    if part.startswith('WORKBOOKS ---'):
        content = part.split('---')[0].split('\n', 1)[1].strip()
        workbooks = json.loads(content)
    elif part.startswith('SHEETS ---'):
        content = part.split('---')[0].split('\n', 1)[1].strip()
        sheets = json.loads(content)
    elif part.startswith('COLUMNS ---'):
        content = part.split('---')[0].split('\n', 1)[1].strip()
        columns = json.loads(content)

print(f"Loaded {len(workbooks)} workbooks, {len(sheets)} sheets, {len(columns)} columns from Supabase.")
print("\nSheets detail in Supabase:")
for s in sheets:
    print(f"  Sheet ID: {s['id']}, Workbook ID: {s['workbook_id']}, Name: '{s['name']}'")

# Check if there are columns for sheets
sheet_cols = {}
for c in columns:
    s_id = c['sheet_id']
    if s_id not in sheet_cols:
        sheet_cols[s_id] = []
    sheet_cols[s_id].append(c)

print("\nFirst sheet columns detail:")
if sheets:
    s = sheets[0]
    cols = sheet_cols.get(s['id'], [])
    print(f"Sheet ID: {s['id']}, Name: '{s['name']}', Columns count: {len(cols)}")
    for c in cols[:5]:
         print(f"  Col: {c['name']}, Type: {c['inferred_type']}, display_order: {c.get('display_order')}")
