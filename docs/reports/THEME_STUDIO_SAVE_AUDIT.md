# THEME_STUDIO_SAVE_AUDIT.md

## Theme Studio Save Failure Investigation

### 1. Is app_themes table created in Supabase?

**Answer**: Unknown - requires schema deployment.

SQL file exists: `docs/THEME_STUDIO_SQL.sql`

### 2. Exact table name being used

**Confirmed**: `app_themes` - matches in `themeService.ts` line 18, 27, 37, etc.

### 3. Exact failing query

```typescript
export const createTheme = async (theme: Omit<Theme, "id" | "created_at">): Promise<Theme> => {
  const { data, error } = await supabase
    .from("app_themes")
    .insert({
      name,
      primary_color,
      accent_color,
      background_color,
      surface_color,
      text_color,
      is_active: false,
      created_by: String(appUser?.id || ""),  // <-- POTENTIAL ISSUE
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};
```

### 4. RLS policies analysis

**Policy from THEME_STUDIO_SQL.sql**:
```sql
CREATE POLICY "theme_manage" ON app_themes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = created_by
      AND (role = 'Admin' OR role = 'SuperAdmin')
    )
  );
```

### 5. Supabase schema mismatch

| Property | Theme Studio SQL | Actual Schema |
|----------|----------------|-------------|
| `users.id` | Implicit check | `TEXT` primary key |
| `users.role` | Checked directly | Does NOT exist in users table |

**Critical Finding**: The `users` table (SUPABASE_SCHEMA.sql line 65-71) does NOT have a `role` column. Roles are stored in `system_roles` table with values like `'super_admin'`, `'admin'`, `'user'`.

### 6. created_by field issue

`created_by` uses `String(appUser?.id || "")` which converts user ID to string. The `users.id` column is TEXT type, so this should work IF the user exists.

### 7. Root cause

**RLS policy references non-existent column**: `role = 'Admin' OR role = 'SuperAdmin'` but:
- `users` table has no `role` column
- `system_roles` table stores roles as `'super_admin'`, `'admin'`, `'user'`

### 8. Fix recommendation

Replace RLS policy in `docs/THEME_STUDIO_SQL.sql`:
```sql
-- OLD (broken)
CREATE POLICY "theme_manage" ON app_themes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = created_by
      AND (role = 'Admin' OR role = 'SuperAdmin')
    )
  );

-- NEW (correct)
CREATE POLICY "theme_manage" ON app_themes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.system_roles sr
      WHERE sr.user_id::text = created_by
      AND sr.role IN ('admin', 'super_admin')
    )
  );
```

**Additional consideration**: The policy may need to be dropped and recreated, or use `auth.uid()` instead of `created_by` for authenticated user checks.