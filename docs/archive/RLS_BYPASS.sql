-- RLS BYPASS FOR DEVELOPMENT
-- Apply this to allow workbook module to work with custom authentication
-- Run AFTER applying SUPABASE_SCHEMA.sql and SUPABASE_RLS.sql

-- Disable RLS entirely on workbook-related tables
-- This allows access without Supabase Auth session
alter table public.workbooks disable row level security;
alter table public.worksheets disable row level security;
alter table public.column_metadata disable row level security;
alter table public.worksheet_rows disable row level security;
alter table public.user_roles disable row level security;
alter table public.audit_logs disable row level security;