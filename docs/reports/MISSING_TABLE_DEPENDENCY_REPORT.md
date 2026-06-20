# Missing Table Dependency Report

## Date: 2026-06-18

---

## Existing Tables (Verified)

- users
- roles
- user_roles
- workbooks
- sheets
- columns
- permissions
- role_permissions
- workspace_assignments
- records_* tables

---

## Missing Tables Analysis

### 1. app_themes

| Attribute | Value |
|-----------|-------|
| **Feature** | Theme Studio |
| **Required/Optional** | REQUIRED |
| **Files Using** | `frontend/src/services/themeService.ts`, `frontend/src/context/ThemeContext.tsx` |
| **Current State** | Migration created: `supabase/migrations/20260618000000_create_app_themes.sql` |

**SQL Schema Required:**
```sql
CREATE TABLE IF NOT EXISTS public.app_themes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    primary_color TEXT NOT NULL DEFAULT '#ABE7B2',
    accent_color TEXT NOT NULL DEFAULT '#CBF3BB',
    background_color TEXT NOT NULL DEFAULT '#ECF4E8',
    surface_color TEXT NOT NULL DEFAULT '#FFFFFF',
    text_color TEXT NOT NULL DEFAULT '#1A1A2E',
    is_active BOOLEAN DEFAULT FALSE,
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_themes_active ON public.app_themes(is_active);

ALTER TABLE app_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "theme_select_active" ON app_themes FOR SELECT USING (is_active = TRUE);
CREATE POLICY IF NOT EXISTS "theme_select_owner" ON app_themes FOR SELECT USING (created_by IS NOT NULL);
CREATE POLICY IF NOT EXISTS "theme_insert_policy" ON app_themes FOR INSERT WITH CHECK (created_by IS NOT NULL);
CREATE POLICY IF NOT EXISTS "theme_owner_update_delete" ON app_themes FOR UPDATE USING (created_by IS NOT NULL);
CREATE POLICY IF NOT EXISTS "theme_owner_delete" ON app_themes FOR DELETE USING (created_by IS NOT NULL);
```

**Recommendation:** CREATE TABLE - Migration already created, needs to be applied to Supabase.

---

### 2. user_presence

| Attribute | Value |
|-----------|-------|
| **Feature** | User Presence Dashboard |
| **Required/Optional** | REQUIRED |
| **Files Using** | `frontend/src/services/presenceService.ts`, `frontend/src/pages/UserPresence.tsx`, `frontend/src/layouts/MainLayout.tsx` |
| **Current State** | Migration created: `supabase/migrations/20260614000100_create_user_presence.sql` |

**SQL Schema Required:**
```sql
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id BIGINT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('online', 'idle', 'offline')),
    current_page TEXT,
    current_workbook_id BIGINT REFERENCES public.workbooks(id) ON DELETE SET NULL,
    session_start TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen);

ALTER TABLE public.user_presence DISABLE ROW LEVEL SECURITY;

INSERT INTO public.permissions (name, description)
VALUES ('view_user_presence', 'Ability to view the user presence dashboard')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name IN ('SuperAdmin', 'Admin') AND p.name = 'view_user_presence'
ON CONFLICT DO NOTHING;
```

**Recommendation:** CREATE TABLE - Migration exists but may not have been applied.

---

### 3. dashboard_widgets

| Attribute | Value |
|-----------|-------|
| **Feature** | Dashboard Builder |
| **Required/Optional** | REQUIRED for Dashboard Builder functionality |
| **Files Using** | `frontend/src/services/dashboardWidgetService.ts`, `frontend/src/pages/DashboardBuilder.tsx`, `frontend/src/pages/UserWorkspace.tsx` |
| **Current State** | Migration exists: `docs/MISSING_TABLES_MIGRATION.sql` but no dedicated migration file |

**SQL Schema Required:**
```sql
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    widget_type TEXT NOT NULL CHECK (widget_type IN ('kpi','table','bar','pie','line','donut','area')),
    workbook_id UUID NOT NULL REFERENCES public.workbooks(id) ON DELETE CASCADE,
    worksheet_id UUID NOT NULL REFERENCES public.sheets(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user_id ON public.dashboard_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_created_by ON public.dashboard_widgets(created_by);
```

**Recommendation:** CREATE TABLE - Required for Dashboard Builder to function.

---

### 4. workspace_notes

| Attribute | Value |
|-----------|-------|
| **Feature** | Worksheet record notes |
| **Required/Optional** | REQUIRED for notes functionality |
| **Files Using** | `frontend/src/services/workspaceService.ts`, `frontend/src/pages/Worksheet.tsx` |
| **Current State** | Migration exists: `supabase/migrations/20260613000100_complete_schema.sql` |

**SQL Schema Required:**
```sql
CREATE TABLE IF NOT EXISTS public.workspace_notes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    workbook_id BIGINT REFERENCES public.workbooks(id) ON DELETE CASCADE,
    sheet_id BIGINT REFERENCES public.sheets(id) ON DELETE CASCADE,
    assignment_id BIGINT REFERENCES public.workspace_assignments(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW
);

CREATE INDEX IF NOT EXISTS idx_workspace_notes_user_id ON public.workspace_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_notes_workbook_id ON public.workspace_notes(workbook_id);
CREATE INDEX IF NOT EXISTS idx_workspace_notes_assignment_id ON public.workspace_notes(assignment_id);
```

**Recommendation:** CREATE TABLE - Required for worksheet record notes to function.

---

### 5. audit_logs

| Attribute | Value |
|-----------|-------|
| **Feature** | Audit trail |
| **Required/Optional** | REQUIRED for audit functionality |
| **Files Using** | `frontend/src/services/auditService.ts`, `frontend/src/services/workbookService.ts`, `frontend/src/services/storageService.ts`, `frontend/src/pages/StorageManagement.tsx`, `frontend/src/pages/UserWorkspace.tsx` |
| **Current State** | Migration exists: `supabase/migrations/20260613000100_complete_schema.sql` |

**SQL Schema Required:**
```sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
```

**Recommendation:** CREATE TABLE - Required for audit trail functionality.

---

### 6. permission_requests

| Attribute | Value |
|-----------|-------|
| **Feature** | Permission request system (future/unused) |
| **Required/Optional** | OPTIONAL - Not actively used |
| **Files Using** | `docs/MISSING_TABLES_MIGRATION.sql` (referenced in SQL but not in code) |
| **Current State** | No active code references. `schemaValidation.ts` does NOT include in REQUIRED_TABLES |

**SQL Schema Required:**
```sql
CREATE TABLE IF NOT EXISTS public.permission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    permission_name TEXT NOT NULL,
    requested_by TEXT NOT NULL REFERENCES public.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Recommendation:** REMOVE REFERENCE - Not actively used. Safe to remove from migration SQL.

---

### 7. worksheets

| Attribute | Value |
|-----------|-------|
| **Feature** | Worksheets feature (alias for sheets) |
| **Required/Optional** | NOT REQUIRED - Uses `sheets` table |
| **Files Using** | Documented in `docs/*_REPORT.md` files, `frontend/src/pages/DashboardBuilder.tsx` (local variable name), `frontend/src/App.tsx` (route path), `frontend/src/pages/Workbooks.tsx` (navigation) |
| **Current State** | No separate table. Code uses `sheets` table directly. `worksheetService.ts` has comment: "uses sheets table" |

**SQL Schema Required:** NONE - Uses existing `sheets` table. Route `/worksheets/:id` maps to sheets.

**Recommendation:** REMOVE REFERENCE - `worksheets` is a conceptual alias. No separate table needed.

---

### 8. worksheet_rows

| Attribute | Value |
|-----------|-------|
| **Feature** | Worksheet record rows |
| **Required/Optional** | NOT REQUIRED - No separate table |
| **Files Using** | Documented in `docs/*_REPORT.md` files |
| **Current State** | Records stored in dynamic `records_<uuid>` tables (e.g., `records_1`, `records_2`) |

**SQL Schema Required:** NONE - Uses existing `records_*` pattern.

**Recommendation:** REMOVE REFERENCE - Records stored in dynamic table pattern, no separate table needed.

---

### 9. column_metadata

| Attribute | Value |
|-----------|-------|
| **Feature** | Column metadata (conceptual term) |
| **Required/Optional** | NOT REQUIRED - Uses `columns` table |
| **Files Using** | None (referenced conceptually in documentation) |
| **Current State** | Code uses `columns` table. Documentation in `docs/` references this as alternative naming but codebase uses `columns` |

**SQL Schema Required:** NONE - Uses existing `columns` table.

**Recommendation:** REMOVE REFERENCE - `columns` table is used, not `column_metadata`.

---

## Summary

| Table | Recommendation | Priority |
|-------|--------------|----------|
| app_themes | CREATE TABLE | HIGH |
| user_presence | CREATE TABLE | HIGH |
| dashboard_widgets | CREATE TABLE | HIGH |
| workspace_notes | CREATE TABLE | HIGH |
| audit_logs | CREATE TABLE | HIGH |
| permission_requests | REMOVE REFERENCE | LOW |
| worksheets | REMOVE REFERENCE | LOW |
| worksheet_rows | REMOVE REFERENCE | LOW |
| column_metadata | REMOVE REFERENCE | LOW |

---

## Existing Migrations That Need Application

1. `supabase/migrations/20260614000100_create_user_presence.sql`
2. `supabase/migrations/20260613000100_complete_schema.sql` (contains workspace_notes, audit_logs)
3. `supabase/migrations/20260618000000_create_app_themes.sql` (newly created)