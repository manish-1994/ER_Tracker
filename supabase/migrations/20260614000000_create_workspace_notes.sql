-- Migration: Create public.workspace_notes and public.audit_logs with record_id support
-- Architecture: PostgREST compatibility, custom database authentication, no RLS enforcement for development

-- 1. Create workspace_notes table with record_id and is_private support
CREATE TABLE IF NOT EXISTS public.workspace_notes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    workbook_id BIGINT REFERENCES public.workbooks(id) ON DELETE CASCADE,
    sheet_id BIGINT REFERENCES public.sheets(id) ON DELETE CASCADE,
    assignment_id BIGINT REFERENCES public.workspace_assignments(id) ON DELETE CASCADE,
    record_id TEXT NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    title TEXT,
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_workspace_notes_record ON public.workspace_notes(sheet_id, record_id);
CREATE INDEX IF NOT EXISTS idx_workspace_notes_user ON public.workspace_notes(user_id);

-- Disable RLS to match developer bypass setup for custom auth
ALTER TABLE public.workspace_notes DISABLE ROW LEVEL SECURITY;

-- 2. Create audit_logs table (if missing)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    payload JSONB
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON public.audit_logs(record_id);

-- Disable RLS to match developer bypass setup
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
