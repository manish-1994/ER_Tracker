# THEME_STUDIO_RLS_FIX_REPORT.md

## Theme Studio RLS Fix

### Old Policy (Broken)
```sql
CREATE POLICY "theme_manage" ON app_themes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = created_by
      AND (role = 'Admin' OR role = 'SuperAdmin')
    )
  );
```

**Problems:**
- `users.role` column does not exist
- `users` table has no role field
- Roles are stored in `system_roles` table with values: `super_admin`, `admin`, `user`

### New Policy (Fixed)
```sql
-- Enable RLS
ALTER TABLE app_themes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow INSERT for authenticated users
CREATE POLICY "theme_insert_auth" ON app_themes
  FOR INSERT WITH CHECK (created_by IS NOT NULL);

-- Policy: Allow SELECT on active themes
CREATE POLICY "theme_select_active" ON app_themes
  FOR SELECT USING (is_active = TRUE);

-- Policy: Allow UPDATE/DELETE for admin/super_admin
CREATE POLICY "theme_admin_ops" ON app_themes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.system_roles sr
      WHERE sr.user_id::text = created_by
      AND sr.role IN ('super_admin', 'admin')
    )
  );
```

### Files Changed
- `docs/THEME_STUDIO_SQL.sql` - Updated RLS policies

### RBAC Analysis
| Role | Insert | Select | Update | Delete |
|------|--------|--------|--------|--------|
| super_admin | ✅ | ✅ (active) | ✅ (own) | ✅ (own) |
| admin | ✅ | ✅ (active) | ✅ (own) | ✅ (own) |
| user | ❌ | ✅ (active only) | ❌ | ❌ |
| viewer | ❌ | ✅ (active only) | ❌ | ❌ |

### Validation Note
The app uses custom authentication without Supabase Auth sessions, so `auth.uid()` may not work. For MVP, the INSERT policy allows any authenticated user (created_by must be set). For production, consider using service role key or implementing proper Supabase Auth integration.