# Widget UUID Fix Report

## Date: 2026-06-18

---

## 1. Error Analysis

**Error Message:** `invalid input syntax for type uuid: "22"`

**Root Cause:** The `dashboard_widgets` table expects UUID values for `workbook_id` and `worksheet_id` columns (per `SUPABASE_SCHEMA.sql` lines 103-104), but the frontend is sending numeric ID values (like `"22"`) obtained from the `sheets` table.

---

## 2. Source of Workbook and Worksheet Values

### Frontend Data Flow

**File:** `frontend/src/pages/DashboardBuilder.tsx`

| Line | Source | Field | Value Source |
|------|--------|-------|--------------|
| 289-299 | `handleSaveWidget` | `workbook_id` | `selWbId` state |
| 77 | `getWorksheets` | `selWsId` | worksheet id from sheets table |
| 88 | `getWorkbooks` | `selWbId` | workbook id from workbooks table |

### Data Origins

| State | Origin | Database Query |
|-------|--------|----------------|
| `selWbId` (workbook_id) | `getWorkbooks()` | `.from("workbooks").select("*")` |
| `selWsId` (worksheet_id) | `getWorksheets(workbookId)` | `.from("sheets").select("*")` |

**Critical:** The frontend queries `sheets` table (line 32), NOT `worksheets` table.

---

## 3. Database Schema Reality Check

### SUPABASE_SCHEMA.sql (Planned Schema)
| Table | ID Type | FK References |
|-------|---------|---------------|
| `workbooks` | UUID | - |
| `worksheets` | UUID | `workbooks(id)` |
| `dashboard_widgets` | UUID | `workbooks(id)`, `worksheets(id)` |

### Actual Database (from migrations)
| Table | ID Type | Evidence |
|-------|---------|----------|
| `workbooks` | UUID | SUPABASE_SCHEMA.sql line 5 |
| `sheets` | BIGINT/INTEGER | `20260613000001_add_records_table_name_to_sheets.sql` uses `WHERE id = 3`, `id = 5`, etc. |
| `dashboard_widgets` | UUID | SUPABASE_SCHEMA.sql lines 103-104 |

**Conflict:** Frontend uses `sheets` table with numeric IDs, but `dashboard_widgets` expects UUID IDs from `workbooks` and `worksheets` (which may not exist).

---

## 4. Type Mismatches

### dashboardWidgetService.ts
| Field | Frontend Type | Expected by DB | Status |
|-------|---------------|--------------|--------|
| `workbook_id` | string (numeric) | UUID | ❌ MISMATCH |
| `worksheet_id` | string (numeric) | UUID | ❌ MISMATCH |
| `user_id` | string | TEXT | ✅ MATCH |
| `created_by` | string | TEXT | ✅ MATCH |

### DashboardBuilder.tsx Data Flow
```typescript
// Line 88: Fetches workbooks - returns UUID strings
const wList = await getWorkbooks();  // Workbook.id = string

// Line 108-119: Fetches worksheets - returns numeric IDs from sheets table
const ws = await getWorksheets(selWbId);  // sheets.id = INTEGER/BIGINT

// Line 292-305: Creates widget with numeric IDs
await createWidgetAssignment({
  workbook_id: selWbId,     // UUID string from workbooks ✓
  worksheet_id: selWsId,    // INTEGER string from sheets ✗
});
```

---

## 5. Root Cause

### Primary Issue
The `sheets` table uses INTEGER/BIGINT primary keys (evidenced by migration updates using numeric IDs like `id = 22`), while `dashboard_widgets.workbook_id` and `dashboard_widgets.worksheet_id` are defined as UUID (per SUPABASE_SCHEMA.sql).

### Secondary Issues
1. Frontend queries wrong table (`sheets` vs `worksheets`)
2. `sheets` table ID type unknown in Supabase - may be INTEGER or UUID
3. Migration schema mismatch between planned and actual

---

## 6. Recommended Fix

### Option A: Align to Sheets Table (INTEGER IDs)
If actual Supabase `sheets` uses INTEGER:

```sql
-- Modify dashboard_widgets to use INTEGER
ALTER TABLE public.dashboard_widgets 
  ALTER COLUMN workbook_id TYPE BIGINT USING NULL,
  ALTER COLUMN worksheet_id TYPE BIGINT USING NULL;
```

### Option B: Align to Worksheets Table (UUID IDs)
If actual Supabase has `worksheets` with UUID:

```sql
-- Modify dashboard_widgets to expect UUID from worksheets
-- Frontend must query worksheets table instead of sheets
ALTER TABLE public.dashboard_widgets 
  ALTER COLUMN worksheet_id TYPE UUID,
  ALTER COLUMN workbook_id TYPE UUID;
```

### Option C: Verify and Unify (Recommended)
1. Check actual Supabase schema:
```sql
SELECT pg_typeof(id), COUNT(*) FROM workbooks GROUP BY 1 LIMIT 5;
SELECT pg_typeof(id), COUNT(*) FROM sheets GROUP BY 1 LIMIT 5;
SELECT pg_typeof(id), COUNT(*) FROM worksheets GROUP BY 1 LIMIT 5;
```

2. Use the table with matching ID types for widgets
3. Remove `parseInt()` conversions in frontend
4. Ensure UUID format preservation

---

## 7. Code Locations to Fix

| File | Line | Current Code | Fix Needed |
|------|------|--------------|------------|
| `worksheetService.ts` | 72 | `id: String(col.id)` | Already string, verify DB returns string |
| `worksheetService.ts` | 278 | `sheet_id: parseInt(worksheetId)` | Remove parseInt, use string |
| `dashboardWidgetService.ts` | 292-305 | Uses `selWsId` (numeric) | Validate UUID format before insert |
| `DashboardBuilder.tsx` | 387-388 | `<option key={u.id} value={u.id}>` | Already uses string value |

---

## 8. Verification Steps

1. **Check actual ID types in Supabase:**
```sql
SELECT column_name, data_type, is_generated 
FROM information_schema.columns 
WHERE table_name IN ('workbooks', 'sheets', 'worksheets') 
AND column_name = 'id';
```

2. **Run in Supabase SQL Editor:**
```sql
-- Test if sheets uses integers
SELECT id FROM sheets LIMIT 3;

-- Test if worksheets exists
SELECT id FROM worksheets LIMIT 3;
```

3. **Verify widget insert after fix:**
```sql
INSERT INTO dashboard_widgets (user_id, title, widget_type, workbook_id, worksheet_id, value_col, aggregation)
VALUES ('test-user', 'Test', 'kpi', 'uuid-workbook', 'uuid-worksheet', 'col1', 'count');
```

---

## 9. Summary

| Issue | Status |
|-------|--------|
| `sheets.id` is INTEGER, `dashboard_widgets.workbook_id` expects UUID | ❌ Confirmed mismatch |
| Frontend queries wrong table name (`sheets` vs `worksheets`) | ⚠️ Potential issue |
| `parseInt` corrupts UUID values in worksheetService.ts | ✅ Identified at line 278 |
| Missing `app_themes` table causes theme save failures | ✅ Documented in THEME_DATABASE_FIX_REPORT.md |