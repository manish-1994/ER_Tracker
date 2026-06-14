# Authorization Schema Refactor Report

## Original Problem
- Frontend code referenced a non‑existent `system_roles` table and attempted to read a `role` column from `user_roles`.
- The actual Supabase schema contains the tables:
  - `users`
  - `roles`
  - `permissions`
  - `user_roles` (columns `user_id`, `role_id`)
  - `role_permissions`

## Schema Overview
| Table | Columns | Primary Key | Foreign Keys |
|-------|---------|-------------|--------------|
| `users` | `id` (uuid), `email`, ... | `id` | – |
| `roles` | `id` (int), `name` (text) | `id` | – |
| `permissions` | `id`, `name` | `id` | – |
| `user_roles` | `user_id` (uuid), `role_id` (int) | (`user_id`, `role_id`) | `user_id` → `users.id`, `role_id` → `roles.id` |
| `role_permissions` | `role_id`, `permission_id` | (`role_id`,`permission_id`) | `role_id` → `roles.id`, `permission_id` → `permissions.id` |

## Changes Made
1. **Removed all `system_roles` references** from the frontend.
2. **AuthContext** (`frontend/src/context/AuthContext.tsx`):
   - Added logic to load the primary system role by joining `user_roles` → `roles` and storing the role name in `systemRole`.
   - Updated workbook role loading to fetch `role_id`s from `user_roles` and resolve their names via the `roles` table, populating `workbookRoles`.
3. **ProtectedRoute** now relies on the updated `systemRole` values (`super_admin`, `admin`, etc.).
4. **MainLayout** uses the refreshed `systemRole` for admin checks.
5. Updated TypeScript typings accordingly.

## Verification Steps
- Ran the application and confirmed no references to `system_roles` exist.
- `AuthContext` successfully retrieves role names from the `roles` table.
- User Management and Role Management pages load without PostgREST `PGRST205` errors.
- Authorization checks in `ProtectedRoute` and `MainLayout` work with the fetched role names.

## Outcome
All tasks are satisfied:
- No `system_roles` references remain.
- Roles are loaded from the real `roles` table via proper joins.
- Both User Management and Role Management pages open correctly.
- Authorization now matches the actual database schema.