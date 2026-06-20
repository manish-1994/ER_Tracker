# Sheets Schema Fix Report

**Date:** 2026-06-19
**Status:** ✅ Fixed

---

## Problem

All frontend queries to the `sheets` table that referenced non-existent columns returned **HTTP 400 Bad Request**. This affected 5 frontend services/files with 8 separate failing queries.

## Root Cause

The `sheets` table in the database has these columns:

| Column | Type | Exists? |
|--------|------|---------|
| `id` | INTEGER | ✅ |
| `workbook_id` | INTEGER | ✅ |
| `name` | TEXT | ✅ |
| `row_count` | INTEGER | ✅ |
| `column_names` | JSONB | ✅ |
| `col_count` | INTEGER | ✅ |

But the frontend was querying these **non-existent columns**:

| Column | HTTP 400? | Reason |
|--------|-----------|--------|
| `records_table_name` | ✅ YES | Never added to `sheets` table |
| `updated_at` | ✅ YES | Never added to `sheets` table |
| `created_at` | ✅ YES | Never added to `sheets` table |

## Fix Applied

### File 1: `frontend/src/services/workbookService.ts`

**`discoverRecordsTables()` (lines 49-70):**
- **Before:** Tried `SELECT records_table_name FROM sheets WHERE records_table_name IS NOT NULL` — always 400
- **After:** Uses `Object.values(SHEET_TO_RECORD_TABLE)` directly from static map

**`findRecordsTablesForSheets()` (lines 72-101):**
- **Before:** Tried `SELECT records_table_name FROM sheets WHERE id IN (...) AND records_table_name IS NOT NULL` — always 400
- **After:** Uses `localStorage.getItem()` and `SHEET_TO_RECORD_TABLE[sheetId]` fallback

**`deleteWorkbook()` (lines 169-172):**
- **Before:** `SELECT id, records_table_name FROM sheets`
- **After:** `SELECT id FROM sheets` — only selects existing columns

**`deleteWorkbook()` (lines 193-198):**
- **Before:** Iterated `sheets` array to push `s.records_table_name` into `recordsTables`
- **After:** Removed — no longer needed since `records_table_name` doesn't exist

### File 2: `frontend/src/services/rowService.ts`

**`resolveRecordTable()` (lines 91-158):**
- **Before:** Tried `SELECT id, records_table_name FROM sheets WHERE id = ?` — always 400
- **Before:** Had `saveToDatabase()` function that tried `UPDATE sheets SET records_table_name = ?` — always 400
- **After:** Removed both DB queries. Relies on localStorage cache → `SHEET_TO_RECORD_TABLE` map → fallback `records_{sheetId}`

### File 3: `frontend/src/services/storageService.ts`

**`discoverRecordsTables()` (lines 52-94):**
- **Before:** Same `SELECT records_table_name FROM sheets` — always 400
- **After:** Uses `[...new Set(Object.values(SHEET_TO_RECORD_TABLE))]` directly

**`getWorkbookAnalysis()` (line 334):**
- **Before:** `SELECT id, name, records_table_name, updated_at FROM sheets` — always 400
- **After:** `SELECT id, name FROM sheets` — only existing columns

**`getWorkbookAnalysis()` (line 344):**
- **Before:** `sheet.records_table_name || localStorage.getItem(...)`
- **After:** `localStorage.getItem(...) || SHEET_TO_RECORD_TABLE[sheet.id]`

### File 4: `frontend/src/pages/Workbooks.tsx`

**`loadStats` query (line 81):**
- **Before:** `SELECT id, workbook_id, records_table_name, name, updated_at, created_at FROM sheets` — always 400
- **After:** `SELECT id, workbook_id, name FROM sheets` — only existing columns

**`workbookStats` iteration (line 84):**
- **Before:** `wb.updated_at || wb.created_at || new Date().toISOString()`
- **After:** `new Date().toISOString()` — workbooks table doesn't have `updated_at` or `created_at`

**Record table resolution (line 91):**
- **Before:** `sheet.records_table_name || \`records_${sheet.id}\``
- **After:** `` `records_${sheet.id}` `` — uses consistent naming convention

## Verification

All sheets queries now return HTTP 200:

```
[200] sheets select id,workbook_id,name with filter
[200] sheets select id only
[200] sheets select id,name
[200] sheets select * (all existing columns)
```

Build passes: `npm run build` — 2882 modules transformed successfully.

## What Was NOT Changed

- No database migrations or schema changes
- No `SHEET_TO_RECORD_TABLE` map entries were added (use existing hardcoded map)
- No widget-related code was modified
- No other tables or services were modified
- Record table resolution now relies entirely on localStorage cache and the static `SHEET_TO_RECORD_TABLE` map

## Files Changed Summary

| File | Lines Changed | Change |
|------|--------------|--------|
| `frontend/src/services/workbookService.ts` | 49-70, 72-101, 169-172, 193-198 | Removed all `records_table_name` queries |
| `frontend/src/services/rowService.ts` | 91-185 | Removed `records_table_name` query + `saveToDatabase()` function |
| `frontend/src/services/storageService.ts` | 52-94, 334, 344 | Removed `records_table_name` and `updated_at` queries |
| `frontend/src/pages/Workbooks.tsx` | 81, 84, 91 | Removed `records_table_name`, `updated_at`, `created_at` references |
