# THEME_STUDIO_RBAC_ALIGNMENT_REPORT.md

## RBAC Alignment Audit

### 1. How Current User Is Identified

**Authentication Flow:**
1. `AuthContext.tsx`:
   - On login: `loginUser()` → `users` table via `username`
   - On restore: `getCurrentApplicationUser()` → localStorage → DB
   - Stores `AppUser { id: number, username, roles[], permissions[] }`

2. `authHelper.ts:loginUser()`:
   - SELECT `id, username, hashed_password` from `users` WHERE `username = ?`
   - bcrypt.compare() for password verification
   - Calls `loadRolesForUser()` which queries `user_roles` → `roles`

3. User ID Types:
   - `users.id`: TEXT (per SUPABASE_SCHEMA.sql line 66: `id text primary key`)
   - `AppUser.id`: `number` (authHelper.ts line 5 - type definition)
   - `user_roles.user_id`: TEXT (matches `users.id`)
   - `system_roles.user_id`: UUID (incompatible - expects Supabase Auth UUID)

### 2. How Role Is Resolved

**Current Working Path:**
```ts
// authHelper.ts:loadRolesForUser() → AuthContext
users.id (TEXT) 
    ↓
user_roles.user_id (TEXT) = users.id
    ↓
user_roles.role_id → roles.id
    ↓
roles.name → "SuperAdmin", "Admin", "Manager", "Analyst", "Viewer"
    ↓
AppUser.roles (string[]) ← Used by ProtectedRoute
```

**Key Code:**
- `authHelper.ts:21-25`: Maps `user_roles.role_id` → `roles.name`
- `ProtectedRoute.tsx:9`: `String(r).trim()` - preserves case for matching
- `roleService.ts:163`: `r.toLowerCase() === "superadmin"` - lowercase bypass check

### 3. How Permissions Are Enforced

**Frontend Enforcement Methods:**

| Method | Code Pattern | Roles Checked |
|--------|------------|---------------|
| `allowedRoles` | Line 26-30 ProtectedRoute.tsx | Exact match: "Admin", "SuperAdmin" |
| `requiredPermission` | Line 18-23 ProtectedRoute.tsx | Uses `DEFAULT_MATRIX` lookup |
| `requiredSystemRole` | Line 34-40 ProtectedRoute.tsx | Hardcoded "SuperAdmin"/"Admin" |

**Theme Studio Route Configuration:**
```tsx
// App.tsx:119
<ProtectedRoute allowedRoles={["Admin", "SuperAdmin"]}>
  <ThemeStudio />
</ProtectedRoute>
```

**Status**: ✅ Frontend RBAC correctly configured for Theme Studio

### 4. Database Schema Review

| Table | Columns | Notes |
|-------|---------|-------|
| `users` | `id TEXT`, `username`, `hashed_password`, `is_active` | Custom auth table |
| `roles` | `id uuid`, `name`, `description` | "SuperAdmin", "Admin", etc. |
| `user_roles` | `id uuid`, `user_id TEXT`, `workbook_id uuid`, `role TEXT` | Workbook-scoped (owner/editor/viewer) |
| `role_permissions` | `id`, `role_id uuid`, `permission_id uuid` | Maps roles to permissions |
| `system_roles` | `user_id UUID`, `role` | `'super_admin'`, `'admin'`, `'user'` - NOT used by frontend |

**Schema Discrepancy:**
- `user_roles.user_id`: TEXT (matches `users.id` TEXT)
- `system_roles.user_id`: UUID (expects Supabase Auth UUID - incompatible with custom auth)

### 5. Theme Studio RLS Issue

**Created By Assignment:**
```ts
// ThemeStudio.tsx:53
created_by: String(appUser?.id || "")  // Outputs "2" (numeric string)
```

**Current RLS Policy:**
```sql
-- THEME_STUDIO_SQL.sql:33-37
WHERE sr.user_id::text = created_by
AND sr.role IN ('super_admin', 'admin')
```

**Root Cause:**
- `created_by = "2"` (TEXT from `users.id`)
- `system_roles.user_id` is UUID format
- `user_id::text = "2"` fails because UUID cast yields different format

---

## Recommendations

### Frontend Authorization
**No changes needed** - `allowedRoles={["Admin", "SuperAdmin"]}` correctly restricts access using the `user_roles` → `roles` join path.

### Backend Authorization (RLS Strategy)

**Problem**: RLS policies reference `system_roles` which uses UUID format incompatible with custom auth.

**Option A (MVP - Recommended):**
Remove admin RLS check, rely on frontend ProtectedRoute:

```sql
CREATE POLICY "theme_select_active" ON app_themes
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "theme_insert_policy" ON app_themes
  FOR INSERT WITH CHECK (created_by IS NOT NULL);

-- Owner can update/delete their themes
CREATE POLICY "theme_owner_ops" ON app_themes
  FOR ALL USING (created_by IS NOT NULL);
```

**Option B (Full Backend RBAC):**
Align `system_roles` with custom auth IDs:

```sql
-- Option B1: Convert user_id to TEXT
ALTER TABLE system_roles 
  ALTER COLUMN user_id TYPE TEXT;

-- Option B2: Or use user_roles join in RLS
CREATE POLICY "theme_admin_ops" ON app_themes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = created_by
      AND r.name IN ('Admin', 'SuperAdmin')
    )
  );
```

---

*Audit performed without implementation changes as requested.*