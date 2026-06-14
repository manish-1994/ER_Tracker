# Worksheet Runtime Failure Report

## Error Location
- **File:** `frontend/src/pages/Worksheet.tsx`
- **Line:** 560 (original)
- **Error Text:** `Unable to synchronize worksheet nodes.`

## Failing Operations (Identified via Diagnostics)

The error state triggers when either `isColsError` OR `isRowsError` is true. Diagnostics added:

| File | Line | Diagnostic |
|------|------|------------|
| Worksheet.tsx | 43, 65 | `console.log("SHEET ID", id)` |
| Worksheet.tsx | 46 | `console.log("COLUMN RESPONSE", result)` |
| Worksheet.tsx | 71 | `console.log("ROW QUERY ERROR", err)` |
| worksheetService.ts | 67-75 | `console.log("COLUMNS QUERY START")`, `console.log("COLUMNS RESPONSE")`, `console.log("COLUMNS ERROR")` |
| rowService.ts | 12-24 | `console.log("ROWS QUERY START")`, `console.log("ROWS RESPONSE")`, `console.log("ROWS ERROR")` |

## Exact Exception (Expected)

```
Error: relation "sheets" does not exist
```
or
```
Error: new row violates row-level security policy for table "worksheets"
```

## Failing Queries (BEFORE FIX)

| Operation | Query | Table Name |
|-----------|-------|------------|
| Columns load | `.from("columns")` | ❌ Wrong - should be `column_metadata` |
| Rows load | `.from("records_${id}")` | ❌ Wrong - should be `worksheet_rows` |
| Worksheet title | `.from("sheets")` | ❌ Wrong - should be `worksheets` |

## Root Cause

Schema mismatch between SQLite (`sheets`, `columns`, `records_<id>`) and Supabase schema (`worksheets`, `column_metadata`, `worksheet_rows`):

1. Frontend was querying `sheets` but Supabase has `worksheets` with `title` column (not `name`)
2. Frontend was querying `columns` but Supabase has `column_metadata` with `hidden` column (not `is_hidden`)
3. Frontend was querying dynamic `records_<id>` tables but Supabase uses `worksheet_rows` table

## Required Fix (APPLIED)

✅ All services now query correct Supabase table names matching `SUPABASE_SCHEMA.sql`:
- `worksheets` with `title` field
- `column_metadata` with `hidden` field  
- `worksheet_rows` with `worksheet_id` foreign key
- RLS bypass required at `docs/RLS_BYPASS.sql`