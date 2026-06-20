# Workbook RLS Migration Report

## Summary

All workbook-related tables have RLS policies that depend on `auth.uid()` and `auth.users(id)`. The frontend uses custom authentication (public.users + bcrypt), creating a fundamental mismatch.

---

## RLS Policy Audit

| Table | Policy Name | Line | Dependency | Required Fix |
|-------|-------------|------|------------|------------|
| `workbooks` | `workbooks_owner_select` | 13 | `owner_id = auth.uid()` | Disable RLS or set owner_id |
| `workbooks` | `workbooks_owner_insert` | 14 | `owner_id = auth.uid()` | Disable RLS or set owner_id |
| `workbooks` | `workbooks_owner_update` | 15 | `owner_id = auth.uid()` | Disable RLS or set owner_id |
| `workbooks` | `workbooks_owner_delete` | 16 | `owner_id = auth.uid()` | Disable RLS or set owner_id |
| `workbooks` | `workbooks_role_select` | 19-21 | `ur.user_id = auth.uid()` | Disable RLS |
| `worksheets` | `worksheets_select` | 25-29 | `ur.user_id = auth.uid()` | Disable RLS |
| `worksheets` | `worksheets_insert` | 30-31 | `ur.user_id = auth.uid()` | Disable RLS |
| `worksheets` | `worksheets_update` | 33-37 | `ur.user_id = auth.uid()` | Disable RLS |
| `worksheets` | `worksheets_delete` | 38-40 | `ur.user_id = auth.uid()` | Disable RLS |
| `column_metadata` | `column_metadata_select` | 43-46 | `ur.user_id = auth.uid()` | Disable RLS |
| `column_metadata` | `column_metadata_insert` | 47-50 | `ur.user_id = auth.uid()` | Disable RLS |
| `column_metadata` | `column_metadata_update` | 51-57 | `ur.user_id = auth.uid()` | Disable RLS |
| `column_metadata` | `column_metadata_delete` | 58-61 | `ur.user_id = auth.uid()` | Disable RLS |
| `worksheet_rows` | `worksheet_rows_select` | 64-67 | `ur.user_id = auth.uid()` | Disable RLS |
| `worksheet_rows` | `worksheet_rows_insert` | 68-71 | `ur.user_id = auth.uid()` | Disable RLS |
| `worksheet_rows` | `worksheet_rows_update` | 72-78 | `ur.user_id = auth.uid()` | Disable RLS |
| `worksheet_rows` | `worksheet_rows_delete` | 79-82 | `ur.user_id = auth.uid()` | Disable RLS |
| `user_roles` | `user_roles_select` | 85-87 | `wb.owner_id = auth.uid()` | Disable RLS |
| `user_roles` | `user_roles_insert` | 88-90 | `wb.owner_id = auth.uid()` | Disable RLS |
| `user_roles` | `user_roles_update` | 91-95 | `wb.owner_id = auth.uid()` | Disable RLS |
| `user_roles` | `user_roles_delete` | 96-98 | `wb.owner_id = auth.uid()` | Disable RLS |
| `audit_logs` | `audit_logs_insert` | 101 | `user_id = auth.uid()` | Disable RLS |
| `audit_logs` | `audit_logs_select` | 102-108 | `auth.uid()` references | Disable RLS |

---

## Schema Mismatch: user_roles Table

| Aspect | RLS Schema | Frontend Code |
|--------|------------|---------------|
| `user_id` type | UUID → `auth.users(id)` | Integer → `public.users(id)` |
| Table reference | `auth.users` | `public.users` |
| Authentication | Supabase Auth JWT | bcrypt + localStorage |

---

## Required Fixes Applied

### Development Environment Fix

Created `docs/RLS_BYPASS.sql` to disable restrictive RLS policies and enable permissive access:

```sql
alter table public.workbooks disable row level security;
alter table public.worksheets disable row level security;
alter table public.column_metadata disable row level security;
alter table public.worksheet_rows disable row level security;
```

### Frontend Changes

Currently no changes - frontend uses Supabase client directly which enforces RLS.

---

## Verification Matrix

| Feature | Before Fix | After Fix |
|---------|------------|-----------|
| Workbook List | ✅ Loads (RLS bypass needed) | ✅ Will load |
| Workbook Detail | ✅ Loads (RLS bypass needed) | ✅ Will load |
| Worksheet View | ❌ Fails RLS | ✅ Will load |
| Worksheet Rows | ✅ Loads (client-side filter) | ✅ Will load |
| Column Metadata | ❌ Fails RLS | ✅ Will load |

---

## Short-term Solution (Development)

Apply `RLS_BYPASS.sql` to disable RLS on workbook tables.

## Long-term Solution (Production)

1. Migrate `user_roles.user_id` to numeric type OR
2. Switch frontend to use Supabase Auth (auth.uid())
3. Set `owner_id` on workbook creation
4. Re-enable RLS policies