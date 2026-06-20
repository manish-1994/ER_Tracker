-- Migration to create the system_roles table for role based access control
-- Table stores the role assigned to each user (one role per user).
CREATE TABLE IF NOT EXISTS public.system_roles (
    user_id uuid NOT NULL,
    role    text NOT NULL,
    PRIMARY KEY (user_id)
);

-- Index on role for quick look‑ups
CREATE INDEX IF NOT EXISTS idx_system_roles_role ON public.system_roles (role);

-- Enable Row Level Security (RLS)
ALTER TABLE public.system_roles ENABLE ROW LEVEL SECURITY;

-- Policy: allow select for authenticated users
CREATE POLICY select_system_roles ON public.system_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: allow insert/update/delete for super_admin role
CREATE POLICY modify_system_roles ON public.system_roles
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.system_roles sr
        WHERE sr.user_id = auth.uid() AND sr.role = 'super_admin'
    ));

-- Ensure the policies are active
ALTER TABLE public.system_roles FORCE ROW LEVEL SECURITY;

-- Bootstrap: insert a super_admin user (replace <SUPER_ADMIN_UUID> with actual UUID later)
INSERT INTO public.system_roles (user_id, role)
VALUES ('<SUPER_ADMIN_UUID>', 'super_admin')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;