import json

with open('live_metadata_utf8.json', 'r', encoding='utf-8') as f:
    text = f.read()

parts = text.split('--- ')
columns = []
for part in parts:
    if part.startswith('COLUMNS ---'):
        content = part.split('---')[0].split('\n', 1)[1].strip()
        columns = json.loads(content)

sheet_18_cols = [c for c in columns if c['sheet_id'] == 18]
print("Sheet 18 columns in Supabase:")
for c in sheet_18_cols:
    print(c)
