# Schema Mismatch Fix Report

## Broken Queries (Before Fix)

| File | Function | Line | Broken Query |
|------|----------|------|--------------|
| `worksheetService.ts` | `getWorksheets` | 27-38 | `.from("worksheets")` |
| `worksheetService.ts` | `createWorksheet` | 41-49 | `.from("worksheets")` |
| `worksheetService.ts` | `updateWorksheet` | 52-66 | `.from("worksheets")` |
| `worksheetService.ts` | `updateColumnDisplayName` | 80-99 | `.from("column_metadata")` |
| `worksheetService.ts` | `hideColumn` | 102-121 | `.from("column_metadata")` |
| `worksheetService.ts` | `reorderColumns` | 124-143 | `.from("column_metadata")` |
| `rowService.ts` | `getRows` | 12-19 | `.from("worksheet_rows")` |
| `rowService.ts` | `getRowsPaginated` | 22-38 | `.from("worksheet_rows")` |
| `rowService.ts` | `createRow` | 41-49 | `.from("worksheet_rows")` |
| `rowService.ts` | `updateRow` | 51-61 | `.from("worksheet_rows")` |
| `rowService.ts` | `deleteRow` | 64-67 | `.from("worksheet_rows")` |
| `roleService.ts` | `getUserRole` | 95-134 | `.from("worksheets")` |
| `Workbooks.tsx` | `handleFileUpload` | 83-92 | `.from("column_metadata")` |
| `Worksheet.tsx` | `fetchCols` | 41-50 | `.from("column_metadata")` |
| `Worksheet.tsx` | `fetchWorksheet` | 253-262 | `.from("worksheets")` |
| `Worksheet.tsx` | `commitEdit` | 193-211 | `updateRow(rowId, payload)` |
| `Worksheet.tsx` | `deleteRowHandler` | 363-372 | `deleteRow(rowId)` |

## Actual Tables (from app.db SQLite)

| Expected Table | Actual Table | Key Columns |
|----------------|--------------|-------------|
| `worksheets` | `sheets` | `id`, `workbook_id`, `name`, `row_count`, `col_count` |
| `worksheet_rows` | `records_<sheet_id>` (dynamic) | `id`, dynamic columns per sheet |
| `column_metadata` | `columns` | `id`, `sheet_id`, `name`, `inferred_type`, `is_hidden`, `display_order` |

## Schema Mapping

| Expected -> Actual | Field Changes |
|-------------------|---------------|
| `worksheets` -> `sheets` | `title` -> `name`, `workbook_id` unchanged |
| `column_metadata` -> `columns` | `worksheet_id` -> `sheet_id`, `hidden` -> `is_hidden`, `order` -> `display_order`, `data_type` -> `inferred_type` |
| `worksheet_rows` -> `records_<sheetId>` | Dynamic table name, schema varies per sheet |

## Files Modified

### `frontend/src/services/worksheetService.ts`
- Changed `.from("worksheets")` -> `.from("sheets")`
- Changed `.from("column_metadata")` -> `.from("columns")`
- Changed `worksheet_id` -> `sheet_id` in queries
- Changed `hidden` -> `is_hidden` in hideColumn
- Changed `order` -> `display_order` in reorderColumns
- Added `getColumns()` function for sheet columns
- Changed `WorksheetUpdate.title` -> `WorksheetUpdate.name`

### `frontend/src/services/rowService.ts`
- Changed `.from("worksheet_rows")` -> `.from(getRecordsTableName(sheetId))`
- Added `getRecordsTableName()` to build dynamic table name
- Updated function signatures to include `sheetId` parameter
- Changed `worksheet_id` -> removed (dynamic table already scoped)

### `frontend/src/services/roleService.ts`
- Changed `.from("worksheets")` -> `.from("sheets")`

### `frontend/src/pages/Workbooks.tsx`
- Changed `.from("column_metadata")` -> `.from("columns")`
- Changed `worksheet_id` -> `sheet_id`
- Changed `data_type` -> `inferred_type`
- Changed `order` -> `display_order`

### `frontend/src/pages/Worksheet.tsx`
- Changed `.from("column_metadata")` -> uses `getColumns()` service
- Changed `.from("worksheets")` -> `.from("sheets")`
- Changed `col.hidden` -> `col.is_hidden`
- Changed `wsData?.title` -> `wsData?.name`
- Updated `updateRow(id, rowId, payload)` call signature
- Updated `deleteRow(id, rowId)` call signature

### `frontend/src/services/auditService.ts`
- Changed `table_name: "worksheet_rows"` -> `table_name: "records"`

## Verification Results

| Feature | Status | Notes |
|---------|--------|-------|
| Workbook List | ✅ | Uses `workbooks` table (unchanged) |
| Workbook Inspect | ⚠️ | Now loads `sheets` - needs table to exist in Supabase |
| Sheet Load | ⚠️ | Loads from `sheets` table |
| Column Load | ⚠️ | Loads from `columns` table |
| Record Load | ⚠️ | Uses dynamic `records_<sheetId>` table |

## Critical Notes

1. **RLS Bypass Required**: Apply `docs/RLS_BYPASS.sql` to Supabase to disable RLS policies that check for `auth.uid()`.

2. **Supabase Schema Sync Needed**: The `sheets` and `columns` tables must exist in Supabase with matching column structure. Run schema migration to sync:
   - `sheets`: `id` (uuid), `workbook_id` (uuid), `name` (text), `row_count` (int), `col_count` (int)
   - `columns`: `id` (uuid), `sheet_id` (uuid), `name` (text), `inferred_type` (text), `is_hidden` (bool), `display_order` (int)

3. **Dynamic Tables**: `records_<sheetId>` tables are dynamically created per sheet. Supabase may not support dynamic table querying. Consider migrating to JSONB `worksheet_rows` table OR ensure dynamic table creation in backend.

4. **Missing Audit Tables**: `user_roles`, `roles`, `audit_logs` tables don't exist in SQLite. The role-based access control will default to "Viewer" for all users.