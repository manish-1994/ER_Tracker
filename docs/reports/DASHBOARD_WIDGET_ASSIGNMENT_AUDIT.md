# Dashboard Builder Assignment Architecture Audit

## Date: 2026-06-18

---

## 1. Current Architecture Analysis

### 1.1 Widget Storage (Current)

**File:** `frontend/src/services/dashboardWidgetService.ts`

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| `dashboard_widgets` | `user_id` | TEXT | Embedded user ownership |
| `dashboard_widgets` | `workbook_id` | TEXT (UUID) | Workbook reference |
| `dashboard_widgets` | `worksheet_id` | TEXT (UUID) | Worksheet reference |

**Problem:** Widgets are NOT reusable. Each widget creation duplicates configuration for every user.

### 1.2 Widget Creation Flow

**File:** `DashboardBuilder.tsx` lines 292-322

```typescript
// Creates widget WITH embedded user_id - no separate assignments
await createWidgetAssignment({
  user_id: selectedUserId,  // Widget tied to single user
  workbook_id: selWbId,     // UUID
  worksheet_id: selWsId,    // Currently STRING (numeric from sheets)
});
```

**Problem:** `worksheet_id` expects UUID from `worksheets` table, but frontend queries `sheets` table.

---

## 2. Required Architecture Changes

### 2.1 New Schema

```sql
-- 1. dashboard_widgets (template/master widgets)
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    widget_type TEXT NOT NULL CHECK (widget_type IN ('kpi','table','bar','pie','line','donut','area')),
    workbook_id INTEGER NOT NULL REFERENCES public.workbooks(id) ON DELETE CASCADE,
    worksheet_id INTEGER NOT NULL REFERENCES public.sheets(id) ON DELETE CASCADE,
    workbook_name TEXT,
    worksheet_name TEXT,
    value_col TEXT NOT NULL,
    value_cols JSONB,
    group_by_col TEXT,
    aggregation TEXT NOT NULL CHECK (aggregation IN ('count','sum','avg','none')),
    config JSONB,
    created_by TEXT NOT NULL REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. dashboard_widget_assignments (user assignments)
CREATE TABLE IF NOT EXISTS public.dashboard_widget_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES public.dashboard_widgets(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_by TEXT NOT NULL REFERENCES public.users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_workbook_id ON public.dashboard_widgets(workbook_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_worksheet_id ON public.dashboard_widgets(worksheet_id);
CREATE INDEX IF NOT EXISTS idx_widget_assignments_widget_id ON public.dashboard_widget_assignments(widget_id);
CREATE INDEX IF NOT EXISTS idx_widget_assignments_user_id ON public.dashboard_widget_assignments(user_id);

-- RLS bypass for custom auth
ALTER TABLE public.dashboard_widgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widget_assignments DISABLE ROW LEVEL SECURITY;
```

---

## 3. ID Type Verification

### Current Schema Conflicts

| Migration File | `workbooks.id` | `sheets.id` | `dashboard_widgets.workbook_id` | `dashboard_widgets.worksheet_id` |
|----------------|---------------|-------------|--------------------------------|--------------------------------|
| `SUPABASE_SCHEMA.sql` | UUID | (worksheets) UUID | UUID | UUID |
| `MISSING_TABLES_MIGRATION.sql` | UUID | INTEGER | Not defined | Not defined |
| Actual DB (needs verification) | ? | ? | ? | ? |

**Critical:** The ID type mismatch prevents widget creation.

---

## 4. Implementation Plan

### 4.1 Phase 1: Schema Migration

Create `supabase/migrations/20260618000100_dashboard_widget_assignments.sql`:

```sql
-- Create unified integer-based schema
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    widget_type TEXT NOT NULL,
    workbook_id INTEGER NOT NULL,
    worksheet_id INTEGER NOT NULL,
    workbook_name TEXT,
    worksheet_name TEXT,
    value_col TEXT NOT NULL,
    value_cols JSONB,
    group_by_col TEXT,
    aggregation TEXT NOT NULL,
    config JSONB,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dashboard_widget_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES public.dashboard_widgets(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    assigned_by TEXT,
    assigned_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.dashboard_widgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_widget_assignments DISABLE ROW LEVEL SECURITY;
```

### 4.2 Phase 2: Service Updates

**File:** `dashboardWidgetService.ts`

| Function | Changes Required |
|----------|-----------------|
| `getWidgetsForUser` | JOIN `dashboard_widget_assignments` to filter by user |
| `createWidgetAssignment` | Split into: create widget, then create assignment |
| `unassignWidget` | NEW: Delete from assignments table only |
| `deleteWidget` | Delete from dashboard_widgets (assignments cascade) |

### 4.3 Phase 3: UI Updates

**File:** `DashboardBuilder.tsx`

| Feature | Current Status | Required |
|---------|----------------|----------|
| Assigned Widgets Grid | Shows `user_id` as assigned user | Show actual username from users table |
| Edit Button | Not present | NEW: Edit widget configuration |
| Unassign Button | Labelled "Unassign" but deletes widget | NEW: Unassign (remove from assignments) |
| Delete Button | Not present | NEW: Delete widget entirely |

---

## 5. Code Changes Required

### 5.1 dashboardWidgetService.ts

```typescript
// NEW: Join assignments to get widgets for user
export const getWidgetsForUser = async (userId: string): Promise<DashboardWidget[]> => {
  const { data, error } = await supabase
    .from("dashboard_widgets")
    .select(`*, dashboard_widget_assignments!inner(user_id)`)
    .eq("dashboard_widget_assignments.user_id", userId);
  // ...
};

// NEW: Unassign widget (remove assignment only)
export const unassignWidget = async (widgetId: string, userId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("dashboard_widget_assignments")
    .delete()
    .eq("widget_id", widgetId)
    .eq("user_id", userId);
  return !error;
};

// NEW: Delete widget entirely
export const deleteWidget = async (widgetId: string): Promise<boolean> => {
  const { error } = await supabase
    .from("dashboard_widgets")
    .delete()
    .eq("id", widgetId);
  return !error;
};
```

### 5.2 DashboardBuilder.tsx

```typescript
// NEW: Add Edit and Delete buttons
// In Assigned Widgets grid (around line 684):
<div className="flex items-center gap-2">
  <button onClick={() => handleEditWidget(w.id)}>Edit</button>
  <button onClick={() => handleUnassignWidget(w.id)} className="unassign-btn">Unassign</button>
  <button onClick={() => handleDeleteWidget(w.id)} className="delete-btn">Delete</button>
</div>
```

---

## 6. Verification Checklist

- [ ] Verify `workbooks.id` is UUID (SUPABASE_SCHEMA.sql)
- [ ] Verify `sheets.id` is INTEGER (from actual DB)
- [ ] Apply migration to create `dashboard_widgets` and `dashboard_widget_assignments`
- [ ] Update `dashboardWidgetService.ts` with JOIN queries
- [ ] Update `DashboardBuilder.tsx` with Edit/Unassign/Delete functionality
- [ ] Update `Dashboard.tsx` to load widgets via assignments table

---

## 7. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Widget creation fails due to UUID/Integer mismatch | Use INTEGER for all IDs to match actual `sheets` table |
| Existing widgets break after migration | Migration uses `CREATE TABLE IF NOT EXISTS` |
| No cascade delete on assignments | FK with `ON DELETE CASCADE` ensures cleanup |