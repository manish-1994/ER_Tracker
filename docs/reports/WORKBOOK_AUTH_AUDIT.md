# Workbook Authentication Audit Report

## Summary

**VERDICT: FAIL**

The workbook platform has a critical authentication architecture conflict. The codebase operates with two distinct authentication systems that are incompatible:

1. **Supabase Auth** (RLS-based) - Expected by `SUPABASE_SCHEMA.sql` and `SUPABASE_RLS.sql`
2. **Custom Users Table** (localStorage + bcrypt) - Used by frontend services

---

## Findings

### 1. Schema vs Code Mismatch: `user_roles.user_id` Type

| Location | Expected | Actual | Status |
|----------|----------|--------|--------|
| `SUPABASE_SCHEMA.sql:47` | `uuid references auth.users(id)` | N/A | Schema |
| `authHelper.ts:17` | Numeric ID from `public.users` | `user_roles.user_id` queried as NUMBER | **FAIL** |
| `roleService.ts:30` | N/A | `user_roles.user_id` queried as UUID | **FAIL** |

**Root Cause:** Schema defines `user_roles.user_id` as UUID referencing `auth.users`, but `authHelper.ts` queries it with numeric IDs from a custom `public.users` table.

### 2. Workbook Ownership Not Assigned

| Location | Issue | Status |
|----------|-------|--------|
| `workbookService.ts:42` | `createWorkbook()` does NOT set `owner_id` | **FAIL** |
| `SUPABASE_RLS.sql:13` | Policy requires `owner_id = auth.uid()` | N/A |

**Root Cause:** `createWorkbook` only inserts `{ name }` without `owner_id`, violating RLS policy.

### 3. RLS Policies Depend on `auth.uid()`

All RLS policies in `SUPABASE_RLS.sql` use `auth.uid()`:

| Table | Policy Check |
|-------|--------------|
| `workbooks` | `owner_id = auth.uid()` |
| `workbooks` | `user_id = auth.uid()` |
| `worksheets` | `user_id = auth.uid()` |
| `column_metadata` | `user_id = auth.uid()` |
| `worksheet_rows` | `user_id = auth.uid()` |
| `audit_logs` | `user_id = auth.uid()` |

**Status:** **FAIL** - RLS requires Supabase Auth session, but frontend uses custom auth.

### 4. Frontend Authentication Pattern

| File | Authentication Used | Status |
|------|---------------------|--------|
| `authHelper.ts` | `localStorage` + bcrypt + `public.users` table | Custom Auth |
| `AuthContext.tsx` | Stores `appUser` from custom auth | Custom Auth |
| `Worksheet.tsx:31` | `getUserRole(id, appUser.id)` using numeric ID | Custom Auth |
| `auditService.ts:22` | `supabase.auth.getUser()` fallback | Mixed |

### 5. Service Query Patterns

All service functions use direct Supabase queries without manual `user_id` injection:

| Service | `owner_id` set | `user_id` set | Status |
|---------|--------------|---------------|--------|
| `createWorkbook()` | No | No | **FAIL** |
| `updateWorkbook()` | No | No | **FAIL** |
| `createWorksheet()` | No | No | **FAIL** |
| `updateWorksheet()` | No | No | **FAIL** |
| `createRow()` | No | No | **FAIL** |
| `audit log` | No | Uses `auth.uid()` fallback | **FAIL** |

---

## Exact File References

### Supabase Auth Dependencies in RLS
```sql
-- docs/SUPABASE_RLS.sql
owner_id = auth.uid()                    -- Line 13
user_id = auth.uid()                     -- Line 16
ur.user_id = auth.uid()                  -- Line 20, 26-28, etc.
```

### Missing `owner_id` Assignment
```typescript
// frontend/src/services/workbookService.ts:39-47
const createWorkbook = async (name: string) => {
  const { data, error } = await supabase
    .from("workbooks")
    .insert({ name })   // Missing: owner_id
    .select()
    .single();
};
```

### Mixed Auth Query
```typescript
// frontend/src/services/auditService.ts:22
const { data } = await supabase.auth.getUser();  // Supabase Auth
finalUserId = data.user?.id || "";               // UUID expected
```

### Custom Users Table Query
```typescript
// frontend/src/services/authHelper.ts:66-70
const { data: user, error } = await supabase
  .from("users")
  .select("id, username, hashed_password")       // Custom users table
  .eq("username", username);
```

---

## Required Fixes

### Option A: Migrate to Supabase Auth (Recommended)
1. Add `owner_id` to `createWorkbook()`:
```typescript
const { data: { user } } = await supabase.auth.getUser();
await supabase.from("workbooks").insert({ name, owner_id: user.id });
```

2. Update `user_roles.user_id` to accept numeric IDs OR migrate to UUID

### Option B: Disable RLS + Custom Auth
1. Remove/adjust RLS policies in `SUPABASE_RLS.sql`
2. Manually inject `user_id`/`owner_id` in all service calls

---

## Feature Impact

| Feature | Current Status | Impact on Migration |
|---------|---------------|-------------------|
| Create Workbook | Will fail RLS | High - needs `owner_id` |
| Rename Workbook | Will fail RLS | High - needs ownership check |
| Delete Workbook | Will fail RLS | High - needs ownership check |
| Rename Worksheet | Will fail RLS | High - needs ownership check |
| Hide Columns | Will fail RLS | High - needs ownership check |
| Reorder Columns | Will fail RLS | High - needs ownership check |
| Add Row | Will fail RLS | High - needs ownership check |
| Update Row | Will fail RLS | High - needs ownership check |
| Search Rows | Will work | Low - read-only |
| Pagination | Will work | Low - read-only |
| Metadata Editor | Will fail RLS | High - needs ownership check |