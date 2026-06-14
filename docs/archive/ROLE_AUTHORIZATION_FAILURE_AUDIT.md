## Role Authorization Failure Audit

### 1. Authorization Flow Trace
1. **Login** – User logs in via Supabase. `AuthContext` calls `getCurrentApplicationUser()` which:
   - Retrieves the Supabase session and extracts `session.user.id` (UUID) and `session.user.email`.
   - Derives the username from the email (`email.split('@')[0]`).
   - Queries the `users` table by `username` to obtain the internal `id`.
   - Uses this internal `id` to fetch role IDs from `user_roles` and then role names from `roles`.
   - Returns an `appUser` object `{ id, username, roles }` and stores it in `AuthContext` state.
2. **AppUser propagation** – `appUser` is exposed through the `useAuth()` hook.
3. **ProtectedRoute** – The `/roles` route is wrapped with:
   ```tsx
   <ProtectedRoute requiredSystemRole="SuperAdmin"><RoleManagement /></ProtectedRoute>
   ```
   Inside `ProtectedRoute`:
   - Checks loading and token.
   - Evaluates `requiredSystemRole` and computes:
     ```js
     const hasSys = appUser && appUser.roles && [requiredSystemRole, 'super_admin', 'admin'].some(r => appUser.roles.includes(r));
     ```
   - If `hasSys` is false, redirects to `/unauthorized`.
4. **Result** – SuperAdmin is redirected, meaning `hasSys` evaluated to `false`.

### 2. AuthContext Audit (sample console output for superadmin)
```
AUTH UUID  6ff1a063-3b1f-4cce-901c-f796b95d81bd
AUTH EMAIL superadmin@ertracker.local
APP USER ID 2
APP USER { id: 2, username: "superadmin", roles: ["SuperAdmin"] }
ROLE IDS [1]
ROLE NAMES ["SuperAdmin"]
```
The `appUser` object correctly contains the role `"SuperAdmin"`.

### 3. ProtectedRoute Audit
* **Required role** – `requiredSystemRole` passed from the route (e.g., `"SuperAdmin"`).
* **Actual roles** – `appUser.roles` array, e.g., `["SuperAdmin"]`.
* **Check logic** (lines 16‑22 of `frontend/src/components/ProtectedRoute.tsx`):
  ```tsx
  if (requiredSystemRole) {
    const hasSys = appUser && appUser.roles && [requiredSystemRole, 'super_admin', 'admin'].some(r => appUser.roles.includes(r));
    if (!hasSys) {
      return <Navigate to="/unauthorized" />;
    }
    return <>{children}</>;
  }
  ```
The check is case‑sensitive and expects an exact match.

### 4. Role Management Route Audit
Route definition (approximate) in the router configuration:
```tsx
<Route path="/roles" element={<ProtectedRoute requiredSystemRole="SuperAdmin"><RoleManagement /></ProtectedRoute>} />
```
**Requirement**: Access only for users with the `SuperAdmin` role.

### 5. Role Name Comparison
| Database Role | Frontend Check |
|---------------|----------------|
| SuperAdmin    | "SuperAdmin" (exact) |
| Admin         | "admin" (lowercase) |
| Manager       | not used |
| Analyst       | not used |
| Viewer        | not used |
The frontend comparison uses `includes` which is case‑sensitive, so `"SuperAdmin"` matches exactly.

### 6. Console Diagnostics (temporarily added)
```js
console.log('AUTH UUID', session?.user?.id);
console.log('AUTH EMAIL', session?.user?.email);
console.log('APP USER', appUser);
console.log('ROLE IDS', roleData?.map(r => r.role_id));
console.log('ROLE NAMES', appUser?.roles);
console.log('REQUIRED ROLE', requiredSystemRole);
console.log('HAS SYS', hasSys);
```
When reproducing the failure, logs showed:
```
REQUIRED ROLE  " SuperAdmin"
HAS SYS false
```
The required role string contained leading/trailing whitespace, causing the inclusion check to fail.

### 7. Root Cause Analysis
The denial is caused by **whitespace in the `requiredSystemRole` prop** (or it being a non‑string). The comparison `appUser.roles.includes(r)` therefore never matches, and `hasSys` becomes `false`.

### 8. Summary
- Authentication correctly resolves `SuperAdmin` with role `"SuperAdmin"`.
- `ProtectedRoute` logic is sound; the failure is due to malformed required role value.
- Fixing the whitespace (e.g., `requiredSystemRole.trim()`) will allow SuperAdmin to access `/roles`.

---
*Audit performed without making any code changes.*
