-- Migration: Create public.workspace_assignments table (BIGINT / BIGSERIAL version)
-- Architecture: Supabase pure REST compatibility with integer user/workbook ids and RLS policies

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.workspace_assignments (
    id BIGSERIAL PRIMARY KEY,
    workbook_id BIGINT NOT NULL REFERENCES public.workbooks(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    assigned_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_export BOOLEAN DEFAULT FALSE,
    notes_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_workspace_user ON public.workspace_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_workbook ON public.workspace_assignments(workbook_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.workspace_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent errors on re-run
DROP POLICY IF EXISTS "SuperAdmin full access" ON public.workspace_assignments;
DROP POLICY IF EXISTS "Users view own assignments" ON public.workspace_assignments;

-- 4. Create policies
-- SuperAdmin Policy: full access to manage assignments
CREATE POLICY "SuperAdmin full access" ON public.workspace_assignments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id::text = auth.uid()::text AND r.name = 'SuperAdmin'
        )
    );

-- Users Policy: view only their own assignments
CREATE POLICY "Users view own assignments" ON public.workspace_assignments
    FOR SELECT
    USING (
        user_id::text = auth.uid()::text
    );
