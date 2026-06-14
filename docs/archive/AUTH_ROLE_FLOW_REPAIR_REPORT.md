# AUTH ROLE FLOW REPAIR REPORT

## Root Cause

Roles were never loaded during login or session restore. The pipeline stopped at `public.users` and never queried `public.user_roles` or `public.roles`.

Additionally, `getCurrentApplicationUser()` used Supabase Auth (`supabase.auth.getSession()`), which is not part of the current architecture (localStorage + bcrypt).

### Database state (verified)

| Username   | Role in `user_roles` |
|-----------|----------------------|
| Admin     | SuperAdmin           |
| testlogin | null                 |
| test      | null                 |
| superadmin| null                 |

Users without a row in `public.user_roles` correctly receive `roles: []` after the fix. The **Admin** account will load `roles: ["SuperAdmin"]`.

---

## Files Inspected

| File | Issue |
|------|-------|
| `frontend/src/services/authHelper.ts` | `loginUser` stored only `{ id, username }`; no role join |
| `frontend/src/context/AuthContext.tsx` | Restored `localStorage` without DB role refresh |
| `frontend/src/layouts/MainLayout.tsx` | `isAdmin` depended on empty `appUser.roles` |
| `frontend/src/components/ProtectedRoute.tsx` | Checked required role string instead of user's roles |

---

## Fix Applied

### `authHelper.ts`

- Added `loadRolesForUser(userId)` — queries `user_roles` → `roles`
- Rewrote `getCurrentApplicationUser()` to read `localStorage` and refresh roles from DB
- Updated `loginUser()` to call `loadRolesForUser()` and persist `{ id, username, roles }` to `localStorage`

### `AuthContext.tsx`

- Session restore now calls `getCurrentApplicationUser()` to refresh roles from DB
- Login sets `appUser` with `sessionUser.roles`
- Added diagnostics: `AUTH RESTORE - appUser`, `AUTH LOGIN - sessionUser`

### `MainLayout.tsx`

- Admin detection uses actual roles:

```ts
const isAdmin =
  appUser?.roles?.includes("SuperAdmin") ||
  appUser?.roles?.includes("Admin");
```

- Added diagnostics: `CURRENT USER`, `CURRENT USERNAME`, `CURRENT ROLES`

### `ProtectedRoute.tsx`

- Admin routes require `SuperAdmin` or `Admin` on `appUser.roles`
- Removed incorrect check that allowed any user when `requiredSystemRole="admin"`

---

## Role Pipeline (after fix)

```
public.users
      ↓  loginUser / getCurrentApplicationUser
public.user_roles   ← loadRolesForUser()
      ↓
public.roles
      ↓
authHelper.ts       → { id, username, roles: ["SuperAdmin"] }
      ↓
AuthContext.tsx     → appUser state + localStorage
      ↓
MainLayout.tsx      → isAdmin → sidebar links
```

---

## Verification Results

| Check | Expected (login as Admin) | Expected (login as superadmin) |
|-------|---------------------------|--------------------------------|
| `appUser.roles` | `["SuperAdmin"]` | `[]` until DB row added |
| Users sidebar link | Visible | Hidden |
| Roles sidebar link | Visible | Hidden |
| Admin Control Center | Visible (SuperAdmin) | Hidden |
| ProtectedRoute `/users` | Allowed | Redirect to `/unauthorized` |

### To assign SuperAdmin to superadmin

```sql
INSERT INTO public.user_roles (user_id, role_id)
SELECT u.id, r.id
FROM public.users u, public.roles r
WHERE u.username = 'superadmin' AND r.name = 'SuperAdmin';
```

---

*Report generated after role flow repair.*
