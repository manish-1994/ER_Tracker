-- Schema Unification Migration
-- Phase 1: Database Updates to align with SCHEMA_UNIFICATION_PLAN.md

-- 1. Add records_table_name column to worksheets table (if missing)
ALTER TABLE public.worksheets
ADD COLUMN IF NOT EXISTS records_table_name TEXT;

-- 2. Add is_hidden column to column_metadata table (if missing)
ALTER TABLE public.column_metadata
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE;

-- 3. Recreate indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_worksheets_workbook_id ON public.worksheets(workbook_id);
CREATE INDEX IF NOT EXISTS idx_worksheets_records_table_name ON public.worksheets(records_table_name);
CREATE INDEX IF NOT EXISTS idx_column_metadata_worksheet_id ON public.column_metadata(worksheet_id);
CREATE INDEX IF NOT EXISTS idx_column_metadata_is_hidden ON public.column_metadata(is_hidden);

-- 4. Verify RLS policies remain valid (recreate if needed)
-- Note: These policies are defined in SUPABASE_RLS.sql and use auth.uid()
-- For custom auth compatibility, policies may need adjustment

-- Policies for worksheets/worksheets (if not exist)
DROP POLICY IF EXISTS worksheets_select_policy ON public.worksheets;
DROP POLICY IF EXISTS worksheets_insert_policy ON public.worksheets;
DROP POLICY IF EXISTS worksheets_update_policy ON public.worksheets;
DROP POLICY IF EXISTS worksheets_delete_policy ON public.worksheets;

-- RLS policies for worksheets (workbook-scoped access via user_roles)
CREATE POLICY worksheets_select_policy ON public.worksheets
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.workbooks wb ON wb.id = ur.workbook_id
    WHERE wb.id = worksheets.workbook_id
    AND ur.user_id::text IN (SELECT id::text FROM public.users)
    AND ur.role IN ('owner', 'editor', 'viewer')
  )
);

CREATE POLICY worksheets_insert_policy ON public.worksheets
FOR INSERT WITH CHECK (workbook_id IN (
  SELECT wb.id FROM public.workbooks wb
  JOIN public.user_roles ur ON ur.workbook_id = wb.id
  WHERE ur.user_id::text IN (SELECT id::text FROM public.users)
  AND ur.role = 'owner'
));

CREATE POLICY worksheets_update_policy ON public.worksheets
FOR UPDATE USING (workbook_id IN (
  SELECT wb.id FROM public.workbooks wb
  JOIN public.user_roles ur ON ur.workbook_id = wb.id
  WHERE ur.user_id::text IN (SELECT id::text FROM public.users)
  AND ur.role IN ('owner', 'editor')
));

CREATE POLICY worksheets_delete_policy ON public.worksheets
FOR DELETE USING (workbook_id IN (
  SELECT wb.id FROM public.workbooks wb
  JOIN public.user_roles ur ON ur.workbook_id = wb.id
  WHERE ur.user_id::text IN (SELECT id::text FROM public.users)
  AND ur.role = 'owner'
));

-- Policies for column_metadata (if not exist)
DROP POLICY IF EXISTS column_metadata_select_policy ON public.column_metadata;
DROP POLICY IF EXISTS column_metadata_insert_policy ON public.column_metadata;
DROP POLICY IF EXISTS column_metadata_update_policy ON public.column_metadata;
DROP POLICY IF EXISTS column_metadata_delete_policy ON public.column_metadata;

CREATE POLICY column_metadata_select_policy ON public.column_metadata
FOR SELECT USING (worksheet_id IN (
  SELECT ws.id FROM public.worksheets ws
  JOIN public.workbooks wb ON wb.id = ws.workbook_id
  JOIN public.user_roles ur ON ur.workbook_id = wb.id
  WHERE ur.user_id::text IN (SELECT id::text FROM public.users)
  AND ur.role IN ('owner', 'editor', 'viewer')
));

CREATE POLICY column_metadata_insert_policy ON public.column_metadata
FOR INSERT WITH CHECK (worksheet_id IN (
  SELECT ws.id FROM public.worksheets ws
  JOIN public.workbooks wb ON wb.id = ws.workbook_id
  JOIN public.user_roles ur ON ur.workbook_id = wb.id
  WHERE ur.user_id::text IN (SELECT id::text FROM public.users)
  AND ur.role = 'owner'
));

CREATE POLICY column_metadata_update_policy ON public.column_metadata
FOR UPDATE USING (worksheet_id IN (
  SELECT ws.id FROM public.worksheets ws
  JOIN public.workbooks wb ON wb.id = ws.workbook_id
  JOIN public.user_roles ur ON ur.workbook_id = wb.id
  WHERE ur.user_id::text IN (SELECT id::text FROM public.users)
  AND ur.role IN ('owner', 'editor')
));

CREATE POLICY column_metadata_delete_policy ON public.column_metadata
FOR DELETE USING (worksheet_id IN (
  SELECT ws.id FROM public.worksheets ws
  JOIN public.workbooks wb ON wb.id = ws.workbook_id
  JOIN public.user_roles ur ON ur.workbook_id = wb.id
  WHERE ur.user_id::text IN (SELECT id::text FROM public.users)
  AND ur.role = 'owner'
));