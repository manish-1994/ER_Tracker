# INSPECT WORKBOOK FINAL FIX

## Root Cause
Frontend queries non-existent `worksheets`, `column_metadata`, `worksheet_rows` tables. Actual database uses `sheets`, `columns`, `records_<id>` table naming.

## Evidence
- `GET /rest/v1/worksheets?select=*&workbook_id=eq.9` returns 404
- Live database has `sheets` table with `name` field (not `title`)
- Live database has `columns` table
- Live database has `records_<worksheetId>` dynamic table pattern for row data

## Broken Queries (Before Fix)

| File | Line | Query |
|------|------|-------|
| worksheetService.ts | 30 | `.from("worksheets").select("*")` |
| worksheetService.ts | 43 | `.from("worksheets").insert({ workbook_id, title })` |
| worksheetService.ts | 55 | `.from("worksheets").update(updates)` |
| worksheetService.ts | 72 | `.from("column_metadata").select("*")` |
| worksheetService.ts | 90 | `.from("column_metadata").update()` |
| worksheetService.ts | 112 | `.from("column_metadata").update()` |
| worksheetService.ts | 134 | `.from("column_metadata").update()` |
| rowService.ts | 15 | `.from("worksheet_rows").select("*").eq("worksheet_id", worksheetId)` |
| rowService.ts | 34 | `.from("worksheet_rows").select("*", { count })` |
| rowService.ts | 48 | `.from("worksheet_rows").insert({ worksheet_id, data })` |
| rowService.ts | 61 | `.from("worksheet_rows").update()` |
| rowService.ts | 74 | `.from("worksheet_rows").delete()` |
| roleService.ts | 99 | `.from("worksheets").select("workbook_id")` |
| Worksheet.tsx | 278 | `.from("worksheets").select("title")` |
| Workbooks.tsx | 85 | `.from("column_metadata").insert()` |

## Fixed Queries (After Fix)

| File | Line | Query |
|------|------|-------|
| worksheetService.ts | 30 | `.from("sheets").select("*")` |
| worksheetService.ts | 43 | `.from("sheets").insert({ workbook_id, name: title })` |
| worksheetService.ts | 55 | `.from("sheets").update({ name: updates.title })` |
| worksheetService.ts | 72 | `.from("columns").select("*")` |
| worksheetService.ts | 90 | `.from("columns").update()` |
| worksheetService.ts | 112 | `.from("columns").update()` |
| worksheetService.ts | 134 | `.from("columns").update()` |
| rowService.ts | 15 | `.from(`records_${worksheetId}`).select("*")` |
| rowService.ts | 34 | `.from(`records_${worksheetId}`).select("*", { count })` |
| rowService.ts | 48 | `.from(`records_${worksheetId}`).insert({ data })` |
| rowService.ts | 61 | `.from(`records_${worksheetId}`).update()` |
| rowService.ts | 74 | `.from(`records_${worksheetId}`).delete()` |
| roleService.ts | 99 | `.from("sheets").select("workbook_id")` |
| Worksheet.tsx | 278 | `.from("sheets").select("name")` → returns `{ title: data?.name }` |
| Workbooks.tsx | 85 | `.from("columns").insert()` |

## Files Changed
1. `frontend/src/services/worksheetService.ts` - 7 table references updated
2. `frontend/src/services/roleService.ts` - 1 table reference updated
3. `frontend/src/services/rowService.ts` - 5 table references updated
4. `frontend/src/pages/Worksheet.tsx` - 1 table reference updated
5. `frontend/src/pages/Workbooks.tsx` - 1 table reference updated

## Field Mapping
| Supabase Schema Field | Actual Database Field |
|----------------------|---------------------|
| `worksheets.title` | `sheets.name` |
| `worksheets.workbook_id` | `sheets.workbook_id` |
| `worksheets.id` | `sheets.id` |
| `column_metadata.*` | `columns.*` |
| `worksheet_rows.*` | `records_<id>.*` |

## Verification Steps
1. ✅ Build passes: `npm run build` completes successfully
2. ⚠️ Navigate to Workbooks page
3. ⚠️ Click Inspect on workbook 9
4. ⚠️ Verify Network tab shows 200 OK on `/rest/v1/sheets?select=*&workbook_id=eq.9`
5. ⚠️ Verify Sheet Node 3/5/7/8/9 loads successfully

## Known Issues
- `columns` table may not have `hidden` field (needs verification)
- RLS policies may block queries without Supabase Auth (use `RLS_BYPASS.sql` for development)