-- Theme Studio SQL - app_themes table
CREATE TABLE app_themes (
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

-- Enable RLS
ALTER TABLE app_themes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow SELECT on active themes (for all users to see applied theme)
CREATE POLICY "theme_select_active" ON app_themes
  FOR SELECT USING (is_active = TRUE);

-- Policy: Allow SELECT on themes created by user (for theme management)
CREATE POLICY "theme_select_owner" ON app_themes
  FOR SELECT USING (created_by IS NOT NULL);

-- Policy: Allow INSERT when created_by is present (frontend RBAC enforced)
CREATE POLICY "theme_insert_policy" ON app_themes
  FOR INSERT WITH CHECK (created_by IS NOT NULL);

-- Policy: Allow owner update/delete operations
CREATE POLICY "theme_owner_update_delete" ON app_themes
  FOR UPDATE USING (created_by IS NOT NULL);

CREATE POLICY "theme_owner_delete" ON app_themes
  FOR DELETE USING (created_by IS NOT NULL);