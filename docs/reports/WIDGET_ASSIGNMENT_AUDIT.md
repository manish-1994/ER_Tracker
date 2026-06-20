# Widget Assignment Audit Report

## Date: 2026-06-18

---

## 1. Table Name

**Primary table**: `dashboard_widgets`

Used by:
- `frontend/src/pages/DashboardBuilder.tsx` (lines 31-34, 292-305)
- `frontend/src/services/dashboardWidgetService.ts` (all operations)

---

## 2. Insert Payload (createWidgetAssignment)

From `dashboardWidgetService.ts:36-63`:

| Field | Source | Type Expected by Frontend |
|-------|--------|------------------------|
| `user_id` | `DashboardBuilder.selectedUserId` | `string` (user ID) |
| `title` | `widgetTitle` state | `string` |
| `widget_type` | `widgetType` state | `"kpi"\|"table"\|"bar"\|..."` |
| `workbook_id` | `selWbId` state | `string` (UUID) |
| `worksheet_id` | `selWsId` state | `string` (UUID) |
| `workbook_name` | `wb?.name` lookup | `string` (optional) |
| `worksheet_name` | `ws?.name` lookup | `string` (optional) |
| `value_col` | `selValCols[0]` | `string` |
| `value_cols` | `selValCols` | `string[]` (optional) |
| `group_by_col` | `selGroupCol` state | `string` (optional) |
| `aggregation` | `selAgg` state | `"count"\|"sum"\|"avg"\|"none"` |
| `config` | `widget.config` | `object` (optional, not provided) |
| `created_by` | `appUser?.id?.toString()` | `string` |

---

## 3. Exact Failing Query

From `dashboardWidgetService.ts:37-54`:

```javascript
const { data, error } = await supabase
  .from("dashboard_widgets")
  .insert({
    user_id: widget.user_id,           // string
    title: widget.title,               // string
    widget_type: widget.widget_type,    // "kpi"|"table"|...
    workbook_id: widget.workbook_id,    // string (UUID)
    worksheet_id: widget.worksheet_id,  // string (UUID)
    workbook_name: widget.workbook_name,// string
    worksheet_name: widget.worksheet_name,// string
    value_col: widget.value_col,       // string
    value_cols: widget.value_cols,     // string[] (JSONB in DB)
    group_by_col: widget.group_by_col, // string
    aggregation: widget.aggregation,   // string
    config: widget.config,             // object (undefined if not provided)
    created_by: widget.created_by,       // string
  })
  .select()
  .single();
```

**Error observed in UI**: "Failed to save widget assignment." (line 333 of DashboardBuilder.tsx)

---

## 4. Root Cause Analysis

### CRITICAL SCHEMA MISMATCH - users.id TYPE

| Source | users.id Type |
|--------|--------------|
| `frontend/src/services/userService.ts` | **NUMBER** (line 4: `type UserId = number \| string`) |
| `frontend/src/services/authHelper.ts` | **NUMBER** (line 5: `id: number`) |
| `frontend/src/pages/DashboardBuilder.tsx` | Uses `String(u.id)` for select value (line 388) |
| `supabase/migrations/SUPABASE_SCHEMA.sql` | **TEXT** (line 66: `id text primary key`) |
| `supabase/migrations/DATABASE_AUTH_MIGRATION.sql` | **UUID** (line 5: `id uuid primary key`) |

**Impact**: `created_by` in `dashboard_widgets` references `users(id)`:
- Migration: `created_by TEXT NOT NULL REFERENCES public.users(id)` (MISSING_TABLES_MIGRATION.sql:19)
- Frontend sends: `appUser?.id?.toString()` which is a number converted to string
- If database has real users with TEXT IDs like "user_123", the FK will fail

### Reference Type Mismatches in dashboard_widgets

| Column | Frontend Type | Migration Type | Match? |
|--------|--------------|----------------|--------|
| `user_id` | string (number→string) | TEXT | ❌ May not match actual users.id |
| `created_by` | string (number→string) | TEXT | ❌ May not match actual users.id |
| `workbook_id` | string (UUID) | UUID | ✅ |
| `worksheet_id` | string (UUID) | UUID | ✅ |
| `value_cols` | string[] | JSONB | ⚠️ Type coercion in Supabase |

### Missing Table

`dashboard_widgets` table does not exist in Supabase database:
- Migration exists at `supabase/migrations/20260618000000_create_app_themes.sql` for `app_themes` only
- `MISSING_TABLES_MIGRATION.sql` (lines 4-25) defines `dashboard_widgets` but NOT APPLIED
- RLS policies in `SUPABASE_RLS_DASHBOARD.sql` reference non-existent table

---

## 5. RLS Analysis

From `SUPABASE_RLS_DASHBOARD.sql:10-23`:

```sql
create policy dashboard_widgets_select on public.dashboard_widgets for select using (true);
create policy dashboard_widgets_insert on public.dashboard_widgets for insert with check (true);
create policy dashboard_widgets_update on public.dashboard_widgets for update using (true) with check (true);
create policy dashboard_widgets_delete on public.dashboard_widgets for delete using (true);
```

**Status**: RLS policies are permissive (no actual blocking). If table existed, inserts would succeed.

---

## 6. Recommended Fix

### Step 1: Create dashboard_widgets table

Run this in Supabase SQL Editor:

```sql
-- Create dashboard_widgets table
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    widget_type TEXT NOT NULL CHECK (widget_type IN ('kpi','table','bar','pie','line','donut','area')),
    workbook_id UUID,
    worksheet_id UUID,
    workbook_name TEXT,
    worksheet_name TEXT,
    value_col TEXT NOT NULL,
    value_cols JSONB,
    group_by_col TEXT,
    aggregation TEXT NOT NULL CHECK (aggregation IN ('count','sum','avg','none')),
    config JSONB,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user_id ON public.dashboard_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_created_by ON public.dashboard_widgets(created_by);

-- RLS
ALTER TABLE public.dashboard_widgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY dashboard_widgets_select ON public.dashboard_widgets FOR SELECT USING (true);
CREATE POLICY dashboard_widgets_insert ON public.dashboard_widgets FOR INSERT WITH CHECK (true);
CREATE POLICY dashboard_widgets_update ON public.dashboard_widgets FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY dashboard_widgets_delete ON public.dashboard_widgets FOR DELETE USING (true);
```

**Note**: Removed FK constraints to `users(id)` and `workbooks/worksheets(id)` due to schema inconsistencies. Remove once schema unified.

### Step 2: Database Schema Audit Required

The `users` table schema has conflicting definitions:
- `SUPABASE_SCHEMA.sql`: `id text primary key`
- `DATABASE_AUTH_MIGRATION.sql`: `id uuid primary key`
- Frontend code: treats `id` as `number`

Verify actual Supabase `users` table schema before adding FK constraints.

---

## Summary

| Issue | Status |
|-------|--------|
| `dashboard_widgets` table missing | ❌ **CONFIRMED** - Migration not applied |
| Schema mismatch (users.id type) | ❌ **CONFIRMED** - Frontend uses number, migrations vary |
| RLS blocking inserts | ✅ Policies permissive, not the cause |
| Column names aligned | ✅ All columns exist in migration |
| Type mismatches | ⚠️ `value_cols`, `config` need JSONB coercion |