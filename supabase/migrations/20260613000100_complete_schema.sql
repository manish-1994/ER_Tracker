-- Migration: Add soft-delete columns to existing record tables
-- Run ALTER TABLE on each dynamic records table to add soft-delete support

-- Note: For dynamic records_<uuid> tables, soft delete columns must be added individually
-- Example for a specific records table:
-- ALTER TABLE public.records_xxx ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
-- ALTER TABLE public.records_xxx ADD COLUMN IF NOT EXISTS deleted_by BIGINT;

-- The rowService.ts deleteRow function will attempt soft delete first, falling back to hard delete
-- Run this in Supabase SQL editor to create all missing tables

-- 1. workspace_assignments table
CREATE TABLE IF NOT EXISTS public.workspace_assignments (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    workbook_id BIGINT NOT NULL REFERENCES public.workbooks(id) ON DELETE CASCADE,
    sheet_id BIGINT REFERENCES public.sheets(id) ON DELETE CASCADE,
    assigned_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_export BOOLEAN DEFAULT FALSE,
    notes_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_assignments_user_id ON public.workspace_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_assignments_workbook_id ON public.workspace_assignments(workbook_id);
CREATE INDEX IF NOT EXISTS idx_workspace_assignments_sheet_id ON public.workspace_assignments(sheet_id);

-- 2. workspace_notes table
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

-- 3. audit_logs table
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