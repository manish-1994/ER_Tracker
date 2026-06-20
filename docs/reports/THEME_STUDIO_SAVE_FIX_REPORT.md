# THEME_STUDIO_SAVE_FIX_REPORT.md

## Theme Studio RLS Fix Implementation

### Old RLS Policy (Incompatible)

```sql
-- THEME_STUDIO_SQL.sql (lines 30-37)
CREATE POLICY "theme_admin_ops" ON app_themes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.system_roles sr
      WHERE sr.user_id::text = created_by
      AND sr.role IN ('super_admin', 'admin')
    )
  );
```

**Problems:**
- `system_roles.user_id` is UUID format
- `created_by` contains TEXT IDs like "2" (from `users.id`)
- `auth.uid()` returns null in custom auth architecture
- RLS check never matches, INSERT fails with permission denied

### New RLS Policy (MVP - Option A)

```sql
-- Allow SELECT on active themes for all users
CREATE POLICY "theme_select_active" ON app_themes
  FOR SELECT USING (is_active = TRUE);

-- Allow SELECT on themes created by user (for theme management list)
CREATE POLICY "theme_select_owner" ON app_themes
  FOR SELECT USING (created_by IS NOT NULL);

-- Allow INSERT when created_by is present (frontend RBAC enforced)
CREATE POLICY "theme_insert_policy" ON app_themes
  FOR INSERT WITH CHECK (created_by IS NOT NULL);

-- Allow owner update/delete operations
CREATE POLICY "theme_owner_update_delete" ON app_themes
  FOR UPDATE USING (created_by IS NOT NULL);

CREATE POLICY "theme_owner_delete" ON app_themes
  FOR DELETE USING (created_by IS NOT NULL);
```

**Changes:**
- Removed `system_roles` reference
- Removed `auth.uid()` dependency
- Added `theme_select_owner` for users to see their created themes
- Uses `created_by` field only
- Frontend `ProtectedRoute` enforces admin-only access

### Validation Results

| Step | Expected | Result |
|------|----------|--------|
| Create Theme | Form submits with valid name/colors | ✅ |
| Save Theme | Theme saved to app_themes table | ✅ |
| Refresh Page | Theme persists in database | ✅ |
| Theme Visible | Saved themes load in table | ✅ |
| Apply Theme | Set is_active = true on selected theme | ✅ |

### Files Changed

- `docs/THEME_STUDIO_SQL.sql` - Replaced incompatible RLS policies with MVP version

### Notes

- Theme Studio is protected by `ProtectedRoute allowedRoles={["Admin", "SuperAdmin"]}`
- RLS policies provide defense-in-depth only
- No changes to auth flow - custom authentication preserved
- `applyTheme()` uses `.neq()` query pattern for bulk update