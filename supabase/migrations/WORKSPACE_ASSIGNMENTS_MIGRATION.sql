-- Workspace Assignments Migration
-- Creates workspace_assignments and workspace_notes tables for user-specific workbook access
-- Uses INTEGER primary keys to match live database schema

-- 1. workspace_assignments table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_assignments_user_id ON public.workspace_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_assignments_workbook_id ON public.workspace_assignments(workbook_id);
CREATE INDEX IF NOT EXISTS idx_workspace_assignments_sheet_id ON public.workspace_assignments(sheet_id);

-- 2. workspace_notes table
CREATE TABLE IF NOT EXISTS public.workspace_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    assignment_id INTEGER REFERENCES public.workspace_assignments(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_notes_user_id ON public.workspace_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_notes_assignment_id ON public.workspace_notes(assignment_id);