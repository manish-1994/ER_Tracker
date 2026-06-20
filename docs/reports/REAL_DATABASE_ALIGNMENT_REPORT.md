# REAL_DATABASE_ALIGNMENT_REPORT.md

## SECTION A – Actual Tables Currently Existing in Supabase

Based on user evidence and error logs:

| Table | Status | Notes |
|-------|--------|-------|
| `users` | EXISTS | Custom auth table |
| `roles` | EXISTS | Role definitions |
| `user_roles` | EXISTS | Workbook role assignments |
| `workbooks` | EXISTS | Workbook parent table |
| `sheets` | EXISTS | Worksheet data (original schema) |
| `workspace_assignments` | EXISTS | Workspace feature table |

## SECTION B – Tables Expected by Frontend (Current Code)

After schema unification changes were applied:

| Table | Used In Code | Notes |
|-------|--------------|-------|
| `worksheets` | `workbookService.ts:55,77,150,200,333,415`, `worksheetService.ts:32,42,53`, `rowService.ts:100,169` | Referenced but DB has `sheets` |
| `column_metadata` | `worksheetService.ts:65,89,114,123,138,148,276,296`, `workbookService.ts:163` | Referenced but may not exist |
| `worksheet_rows` | Not directly used | JSONB payload table |
| `dashboard_widgets` | `dashboardWidgetService.ts:23,38,67,83,97` | Referenced but may not exist |
| `app_themes` | `themeService.ts:18,27,37,47,57,72` | Referenced but may not exist |
| `audit_logs` | `workbookService.ts:219`, `storageService.ts:157,257` | Referenced but may not exist |

**Evidence from code**:
- `rowService.ts:100` - `.from("worksheets")` 
- `worksheetService.ts:65` - `.from("column_metadata")`
- `dashboardWidgetService.ts:23` - `.from("dashboard_widgets")`
- `themeService.ts:18` - `.from("app_themes")`

## SECTION C – Tables Expected by Migration Plans

| Migration File | Tables Expected |
|----------------|-----------------|
| `docs/archive/SUPABASE_SCHEMA.sql` | `worksheets`, `column_metadata`, `worksheet_rows`, `user_roles`, `audit_logs`, `users`, `roles`, `permissions`, `role_permissions`, `dashboard_widgets` |
| `docs/SCHEMA_UNIFICATION_MIGRATION.sql` | Updates to `worksheets`, `column_metadata` (add missing columns) |
| `docs/MISSING_TABLES_MIGRATION.sql` | `dashboard_widgets`, `user_presence`, `workspace_notes`, `permission_requests` |
| `supabase/migrations/*.sql` | `user_presence`, `workspace_notes`, `workspace_assignments` |

## SECTION D – Recommended Path

### Option A: Keep Existing Schema (sheets) – **RECOMMENDED**

**Rationale**:
- Database contains `sheets` table, NOT `worksheets`
- Error: "Could not find table public.worksheets - Perhaps you meant public.sheets"
- Frontend was originally built against `sheets`
- `SHEET_TO_RECORD_TABLE` mapping in rowService.ts confirms sheet-based architecture
- Less risk - no data migration required

**Actions Required**:
1. Revert frontend changes to use `sheets` instead of `worksheets`
2. Determine if `columns` table exists (for column_metadata)
3. Apply only truly missing tables: `dashboard_widgets`, `app_themes`, `audit_logs`, `workspace_notes`

### Option B: Migrate Fully to worksheets (NOT RECOMMENDED)

**Rationale**:
- `SUPABASE_SCHEMA.sql` defines `worksheets` and `column_metadata`
- Would be consistent with schema design

**Issues**:
- Breaking change requiring data migration
- Risk of data loss
- Error logs confirm `worksheets` does not exist
- Would require renaming `sheets` table or creating new table and migrating data

---

**RECOMMENDATION: Option A** - Revert frontend to `sheets`/`columns` schema to match actual database state.

---

*Audit performed based on error logs and code inspection. Do NOT implement without verification.*