-- Migration: Create public.user_presence table and seed permissions
-- Architecture: PostgREST compatibility, custom database authentication, no RLS enforcement for development

-- 1. Create table
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('online', 'idle', 'offline')),
    current_page TEXT,
    current_workbook_id TEXT,
    session_start TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen);

-- Disable RLS to match developer bypass setup
ALTER TABLE public.user_presence DISABLE ROW LEVEL SECURITY;

-- 2. Seed view_user_presence permission
INSERT INTO public.permissions (name, description)
VALUES ('view_user_presence', 'Ability to view the user presence dashboard')
ON CONFLICT (name) DO NOTHING;

-- 3. Map view_user_presence permission to SuperAdmin and Admin roles
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name IN ('SuperAdmin', 'Admin') AND p.name = 'view_user_presence'
ON CONFLICT DO NOTHING;
