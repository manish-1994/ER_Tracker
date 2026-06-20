-- Missing Tables Migration
-- Tables identified as missing from current Supabase schema

-- 1. dashboard_widgets table (used by DashboardBuilder)
CREATE TABLE IF NOT EXISTS public.dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    widget_type TEXT NOT NULL CHECK (widget_type IN ('kpi','table','bar','pie','line','donut','area')),
    workbook_id UUID NOT NULL REFERENCES public.workbooks(id) ON DELETE CASCADE,
    worksheet_id UUID NOT NULL REFERENCES public.worksheets(id) ON DELETE CASCADE,
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

-- Indexes for dashboard_widgets
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_user_id ON public.dashboard_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_created_by ON public.dashboard_widgets(created_by);

-- 2. user_presence table (used by UserPresence feature)
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('online','idle','offline')),
    current_page TEXT,
    current_workbook_id INTEGER,
    session_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. workspace_assignments table (defined in WORKSPACE_ASSIGNMENTS_MIGRATION.sql)
CREATE TABLE IF NOT EXISTS public.workspace_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workbook_id INTEGER NOT NULL REFERENCES public.workbooks(id) ON DELETE CASCADE,
    sheet_id INTEGER NULL REFERENCES public.sheets(id) ON DELETE CASCADE,
    assigned_by INTEGER,
    assigned_at TIMESTAMP DEFAULT NOW(),
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_export BOOLEAN DEFAULT FALSE,
    notes_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_assignments_user_id ON public.workspace_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_assignments_workbook_id ON public.workspace_assignments(workbook_id);
CREATE INDEX IF NOT EXISTS idx_workspace_assignments_sheet_id ON public.workspace_assignments(sheet_id);

-- 4. workspace_notes table (defined in WORKSPACE_ASSIGNMENTS_MIGRATION.sql)
CREATE TABLE IF NOT EXISTS public.workspace_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    assignment_id INTEGER REFERENCES public.workspace_assignments(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_notes_user_id ON public.workspace_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_notes_assignment_id ON public.workspace_notes(assignment_id);

-- 5. permission_requests table (referenced in schemaValidation.ts)
-- NOTE: Purpose unclear - may be for future permission request feature
CREATE TABLE IF NOT EXISTS public.permission_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    permission_name TEXT NOT NULL,
    requested_by TEXT NOT NULL REFERENCES public.users(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);