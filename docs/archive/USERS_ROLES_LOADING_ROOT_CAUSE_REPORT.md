# USERS_ROLES_LOADING_ROOT_CAUSE_REPORT.md

**Date**: 2026-06-12  
**Severity**: CRITICAL — Users and Roles pages show empty tables despite data in DB  
**Status**: ✅ FIXED

---

## Files Inspected

| File | Purpose |
|------|---------|
| `frontend/src/services/userService.ts` | `getUsers()` query |
| `frontend/src/services/roleService.ts` | `fetchRoles()` query |
| `frontend/src/pages/UserManagement.tsx` | Users page state + render |
| `frontend/src/pages/RoleManagement.tsx` | Roles page state + render |
| `frontend/src/services/supabaseClient.ts` | Supabase connection config |
| `docs/USERS_PAGE_DATA_LOADING_REPORT.md` | Previous bug report (same issue) |
| `docs/SUPABASE_RLS.sql` | RLS policies |
| `docs/DATABASE_AUTH_ARCHITECTURE_MASTER_REPORT.md` | DB schema master reference |

---

## Root Cause

### Primary Bug: `created_at` column does not exist in `public.users`

The `getUsers()` function in `userService.ts` was modified during the User Management Sprint to include `created_at` in the SELECT query:

```ts
// BROKEN — public.users has no created_at column
.select("id, username, is_active, created_at")
```

When Supabase receives a SELECT for a non-existent column, it returns a **PostgreSQL error 42703** (`column users.created_at does not exist`). The original error-handling code swallowed this silently and returned an empty array, leaving `users` state as `[]` — rendering an empty table.

> **This exact bug was previously documented in `USERS_PAGE_DATA_LOADING_REPORT.md` (line 37):**  
> *"the `users` table does not contain a `created_at` column. This caused the Supabase query to fail with Postgres error code `42703`, leaving the `users` state empty."*

The same fix was undone during the latest sprint when `created_at` was re-added.

### Secondary Bug: Column rendered in table that didn't exist

The `CyberTable` column definition also included a "Created" column accessing `row.created_at`, which rendered `"—"` for all rows even if data returned, making it appear broken.

---

## Queries Found

### getUsers() — BEFORE (broken)
```ts
const { data: users, error } = await supabase
  .from("users")
  .select("id, username, is_active, created_at")  // ← 42703 error
  .order("id", { ascending: true });
```

### getUsers() — AFTER (fixed)
```ts
const { data: users, error } = await supabase
  .from("users")
  .select("id, username, is_active")  // ← matches actual schema
  .order("id", { ascending: true });
```

### fetchRoles() — no issue found
```ts
const { data, error } = await supabase
  .from("roles")
  .select("*")
  .order("id", { ascending: true });
```
`public.roles` table schema was correct. If roles also appear empty, it's because `fetchData()` uses `Promise.all()` — if `getUsers()` throws, the entire `fetchData()` call fails and `setRoles()` is never called either.

---

## RLS Analysis

From `SUPABASE_RLS.sql` and `DATABASE_AUTH_ARCHITECTURE_MASTER_REPORT.md`:

- RLS is **NOT enabled** on `public.users`, `public.roles`, or the custom `public.user_roles` (role-assignment table)
- RLS IS enabled on `workbooks`, `worksheets`, `column_metadata`, `worksheet_rows`, `audit_logs`
- The anon key is used with no Supabase Auth session (custom bcrypt auth)
- **RLS is not blocking the users or roles query**

---

## Error Flow (What Actually Happened)

```
fetchData()
  └─ Promise.all([getUsers(), fetchRoles()])
       └─ getUsers()
            └─ supabase.from("users").select("id, username, is_active, created_at")
                 └─ POSTGRES ERROR 42703: column users.created_at does not exist
                      └─ error is thrown
                           └─ catch block: console.error + toast.error
                                └─ setUsers([])  ← NEVER CALLED
                                └─ setRoles([])  ← NEVER CALLED
```

Both states remain `[]`. Table renders empty. No visible error on screen (only in DevTools console).

---

## Fixes Applied

| # | File | Change |
|---|------|--------|
| 1 | `userService.ts` | Removed `created_at` from `getUsers()` SELECT |
| 2 | `userService.ts` | Added `console.log` diagnostics to `getUsers()` |
| 3 | `roleService.ts` | Added `console.log` diagnostics to `fetchRoles()` |
| 4 | `UserManagement.tsx` | Added `isLoadingData` + `fetchError` state |
| 5 | `UserManagement.tsx` | `fetchData()` now logs all counts and errors |
| 6 | `UserManagement.tsx` | Removed "Created" column from table (column doesn't exist in DB) |
| 7 | `UserManagement.tsx` | Added temporary **Diagnostic Panel** shown when data fails to load |

---

## Verification Results

- `public.users` actual columns: `id`, `username`, `hashed_password`, `is_active`
- `public.roles` actual columns: `id`, `name`, `description`
- Query with corrected SELECT returns 4 users: `Admin`, `testlogin`, `test`, `superadmin`
- Build: `npm run build` → 2991 modules, 0 TypeScript errors

---

## Prevention

> **Rule**: Never add `created_at` to `public.users` SELECT without first verifying the live schema. The field **does not exist** in the current Supabase instance. See `USERS_PAGE_DATA_LOADING_REPORT.md` for prior history of this exact issue.
