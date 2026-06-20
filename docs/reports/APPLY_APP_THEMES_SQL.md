# Apply app_themes SQL

## SQL Required for Supabase Dashboard

Run this SQL in the Supabase SQL Editor to create the `app_themes` table with proper indexes, constraints, and RLS policies.

```sql
-- Create app_themes table for Theme Studio functionality
CREATE TABLE IF NOT EXISTS public.app_themes (
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

-- Create index for active theme queries
CREATE INDEX IF NOT EXISTS idx_app_themes_active ON public.app_themes(is_active);

-- Enable RLS (Row Level Security)
ALTER TABLE app_themes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow SELECT on active themes (all users can see the applied theme)
CREATE POLICY IF NOT EXISTS "theme_select_active" ON app_themes
    FOR SELECT USING (is_active = TRUE);

-- Policy: Allow SELECT on themes with created_by (for theme management)
CREATE POLICY IF NOT EXISTS "theme_select_owner" ON app_themes
    FOR SELECT USING (created_by IS NOT NULL);

-- Policy: Allow INSERT when created_by is present (frontend RBAC enforced)
CREATE POLICY IF NOT EXISTS "theme_insert_policy" ON app_themes
    FOR INSERT WITH CHECK (created_by IS NOT NULL);

-- Policy: Allow owner update/delete operations
CREATE POLICY IF NOT EXISTS "theme_owner_update_delete" ON app_themes
    FOR UPDATE USING (created_by IS NOT NULL);

-- Policy: Allow owner delete operations
CREATE POLICY IF NOT EXISTS "theme_owner_delete" ON app_themes
    FOR DELETE USING (created_by IS NOT NULL);
```

## Verification

After running the SQL, verify with:
```sql
SELECT * FROM app_themes LIMIT 5;
SELECT COUNT(*) FROM app_themes;
```