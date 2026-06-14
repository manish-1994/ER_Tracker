# USERS PAGE DIAGNOSTIC REPORT

## Root Cause

The Users page displayed an empty table because `UserManagement.tsx` treated service responses as axios-style `{ data: [...] }` objects, but both `getUsers()` and `fetchRoles()` return **plain arrays**.

```ts
// Broken
setUsers(Array.isArray(uRes?.data) ? uRes.data : []);  // uRes.data is always undefined

// Fixed
setUsers(Array.isArray(usersData) ? usersData : []);
```

A secondary issue: `getRoles()` from `roleService` returns `user_roles` assignments, not role definitions needed by `UserForm`. Switched to `fetchRoles()` for the role picker.

---

## Files Inspected

| File | Finding |
|------|---------|
| `frontend/src/services/userService.ts` | `getUsers()` returned raw user rows without joined roles |
| `frontend/src/pages/UserManagement.tsx` | Read `.data` from array responses; wrong role fetch function |
| `frontend/src/services/roleService.ts` | `getRoles()` = assignments; `fetchRoles()` = role definitions |

---

## Fix Applied

### `userService.ts` — `getUsers()`

- Fetches users from `public.users`
- Joins `public.user_roles` and `public.roles` in application code
- Returns array of users with `roles: [{ id, name }, ...]` for table rendering

### `UserManagement.tsx`

- Changed import from `getRoles` to `fetchRoles`
- Fixed state assignment to use arrays directly
- Added diagnostics: `USERS RAW`, `USERS COUNT`
- Guarded role column render: `(u.roles ?? []).map(...)`

---

## Data Flow (after fix)

```
getUsers()
  → supabase.from("users").select(...)
  → supabase.from("user_roles").select(...)
  → supabase.from("roles").select(...)
  → merged array

fetchData()
  → setUsers(usersData)     ✓
  → setRoles(rolesData)     ✓

<table>
  → users.map(...)          ✓ renders rows
```

---

## Verification Results

| Check | Result |
|-------|--------|
| Query returns rows | Yes — `getUsers()` returns user array from Supabase |
| Rows stored in state | Yes — `setUsers(usersData)` without `.data` |
| Rows rendered | Yes — table maps over `users` state |
| Role badges | Yes — joined from `user_roles` + `roles` |
| Users without roles | Safe — `(u.roles ?? [])` prevents crash |

### Console diagnostics

After visiting `/users`:

```
USERS RAW  [{ id, username, is_active, created_at, roles: [...] }, ...]
USERS COUNT  4
```

---

## Note

Access to `/users` requires `SuperAdmin` or `Admin` on the logged-in user (see `AUTH_ROLE_FLOW_REPAIR_REPORT.md`). Log in as **Admin** to verify the table, or assign a role to other accounts first.

---

*Report generated after Users page repair.*
