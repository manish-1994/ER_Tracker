# USER_ROLE_IMPLEMENTATION_AUDIT

## 1. Current Architecture
- **Frontend** uses React with a `AuthContext` that wraps Supabase Auth. The context provides `login`, `logout`, and the JWT token via `useAuth()`.
- **ProtectedRoute** component checks only for a valid token; role‑based UI gating is done via a placeholder `isSuperAdmin` flag (currently always `false`).
- **MainLayout** shows a “User Management” navigation entry only when `isSuperAdmin` is true.
- **UserManagement** and **RoleManagement** pages exist but contain minimal UI – they fetch data from Supabase tables but do not currently expose create/update actions.
- **Supabase** stores authentication users in the built‑in `auth.users` table. Custom tables are:
  - `user_roles` – maps a Supabase user ID to a workbook‑scoped role (`owner`, `editor`, `viewer`).
  - `user_profiles` – **no longer used** after migration; profile data is now obtained via `supabase.auth.getUser()`.

## 2. Existing Tables & Services
| Table | Purpose |
|-------|---------|
| `auth.users` | Supabase managed authentication (email/password, JWT). |
| `user_roles` | RBAC mapping of users to workbooks (role, workbook_id). |
| `user_profiles` | Legacy table – deprecated, not used. |

**Services** (`frontend/src/services/`):
- `supabaseClient.ts` – creates the Supabase client instance.
- No dedicated *user* service; user CRUD is performed directly via `supabase.auth` calls in `AuthContext` and occasional ad‑hoc queries in pages.
- `roleService.ts` – provides `getRoles(workbookId)` used by `RoleManagement`. It only reads roles; there is no create/update/delete API.

## 3. Missing Functionality
1. **User Creation by SuperAdmin**
   - No UI or service to create new Supabase Auth users from the app. `AuthContext` only signs in existing users.
   - Supabase admin SDK is required to create users server‑side or via a privileged client.
2. **Username‑only Login Support**
   - The login page expects an email address (`supabase.auth.signInWithPassword`). Username‑only flow is not implemented.
3. **Role Assignment UI**
   - `RoleManagement` only lists roles; there are no forms/buttons to assign or update a role for a selected user.
4. **Role Persistence after Login**
   - After login, the app does not fetch the current user's roles (e.g., via `user_roles`) and store them in context, so `ProtectedRoute` cannot enforce role‑based routing.
5. **Permission Enforcement**
   - `ProtectedRoute` currently contains only a placeholder comment; it does not verify the required role against the user's actual permissions.
6. **Audit of Role Changes**
   - No audit logging for role assignments/updates.

## 4. Required Fixes
| Area | Fix |
|------|-----|
| **User Creation** | Add a `createUser(email, password, username?)` function using Supabase Admin API (via a secure serverless function or Supabase Edge Function). Expose it through a new `userService.ts` with proper role checks (only SuperAdmin). |
| **Username‑only Login** | Extend `login` in `AuthContext` to accept either email or username. If a username is provided, query a custom `user_profiles`‑like view that maps usernames to emails, then call `signInWithPassword`. |
| **Role Assignment UI** | Implement forms in `UserManagement` to select a user and assign a role for a specific workbook (INSERT/UPDATE into `user_roles`). Add corresponding mutations in `roleService.ts`. |
| **Load Roles on Session Restore** | After restoring the Supabase session, fetch the user's roles (`supabase.from('user_roles').select('*').eq('user_id', user.id)`) and store them in context (e.g., `userRoles`). |
| **ProtectedRoute Enforcement** | Update `ProtectedRoute` to read `userRoles` from context and verify that the required role (or a higher role) exists for the current workbook/context before rendering the child component. |
| **MainLayout Admin Links** | Replace the hard‑coded `isSuperAdmin` flag with a check against the loaded roles (`userRoles.includes('SuperAdmin')`). |
| **Audit Logging** | Create an `auditService` call to log role assignment changes (`INSERT` into `audit_logs`). |

## 5. Recommended Implementation Order
1. **Backend support** – Create a secure Supabase Edge Function (`/functions/create_user`) that accepts a SuperAdmin‑only request and calls `supabase.auth.admin.createUser`.
2. **User Service** – Add `frontend/src/services/userService.ts` with wrappers for the edge function and role fetch.
3. **Context Extension** – Extend `AuthContext` to store `userRoles` and expose a `refreshRoles` method after login or session restore.
4. **UI – UserManagement** – Build a table of users with an “Add User” button that calls `createUser`. Add role assignment dropdowns per user.
5. **UI – RoleManagement** – Enhance to allow role updates (reuse the same service).
6. **ProtectedRoute** – Implement role checking logic using the `requiredRole` prop and the context roles.
7. **MainLayout** – Show admin navigation only when the SuperAdmin role is present in the loaded roles.
8. **Audit** – Log each create‑user and role‑assignment action via `auditService`. Update the audit section of the knowledge base.
9. **Testing** – Add unit tests for the new services and end‑to‑end tests for the user creation/role assignment flows.

---

*Prepared as part of the post‑auth cleanup and core functional validation phases. No code changes have been applied yet.*
