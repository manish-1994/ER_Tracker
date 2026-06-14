# Authorization ID Mapping Fix Report

## Issue
The frontend was using the Supabase Auth UUID (`session.user.id`) to query the
`user_roles` table, which expects the **internal numeric user ID** from the
`users` table. This caused 400 errors and redirects to `/unauthorized` for all
users, including the super‑admin.

## Solution
1. **Helper added** – `frontend/src/services/authHelper.ts` provides
   `getCurrentApplicationUser()` which maps the Auth UUID to the internal user
   record (by email) and fetches the associated role names.
2. **AuthContext** updated:
   - Stores the full `appUser` object (`id`, `username`, `roles`).
   - Removed the old `loadSystemRole` / `loadWorkbookRoles` functions that used
     the UUID directly.
   - Provides `appUser` through the context (renamed from `systemRole` /
     `workbookRoles`).
3. **ProtectedRoute**, **MainLayout**, **UserManagement**, **RoleManagement**
   now consume `appUser` and check roles via `appUser.roles`.
4. **Diagnostics** added (`console.log`) to output the Auth UUID, the resolved
   application user ID, and the role list.

## Verification
- Completed a full build (`npm run build`) – succeeds.
- Logged in as `superadmin` (internal ID `2`).
- Console shows:
  ```
  AUTH UUID <uuid>
  APP USER ID 2
  ROLES ["SuperAdmin"]
  ```
- Navigation to Dashboard, User Management and Role Management works with no
  redirects.
- No 400 errors from `user_roles` queries.

## Outcome
All authorization flows now correctly map the Supabase Auth user to the
application’s internal user model, satisfying the success criteria.