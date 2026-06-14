# Worksheet Inspect Failure Report

## Root Cause

**CONFLICT between RLS policy and frontend authentication.**

The `getWorksheets()` function queries `worksheets` table with RLS enabled. The RLS policy in `SUPABASE_RLS.sql:25-29` requires:

```sql
create policy worksheets_select on public.worksheets for select using (
    exists (select 1 from public.user_roles ur
            join public.workbooks wb on wb.id = ur.workbook_id
            where wb.id = worksheets.workbook_id 
              and ur.user_id = auth.uid() 
              and ur.role in ('owner','editor','viewer'))
);
```

This requires `user_roles.user_id = auth.uid()` - a Supabase Auth UUID.

However, the frontend uses custom authentication with numeric IDs from `public.users`, and `createWorkbook()` doesn't set `owner_id`, so there's no `user_roles` entry to satisfy the RLS policy.

---

## Failing Query

**File:** `frontend/src/services/worksheetService.ts:27`

```typescript
export const getWorksheets = async (workbookId: string): Promise<Worksheet[]> => {
  const { data, error } = await supabase
    .from("worksheets")
    .select("*")
    .eq("workbook_id", workbookId);
  if (error) throw error;
  return (data ?? []) as Worksheet[];
};
```

**Error:** RLS policy violation - no matching `user_roles` entry for `auth.uid()`.

---

## Files Changed

| File | Change |
|------|--------|
| `worksheetService.ts` | Added diagnostics: `console.log("WORKSHEET QUERY START", { workbookId })`, response/error logging, count logging |
| `Workbooks.tsx` | Added diagnostics: `console.log("INSPECT WORKBOOK ID", workbookId)`, error logging |

---

## Required Fixes

### Fix 1: Disable RLS on worksheets (temporary)
```sql
alter table public.worksheets disable row level security;
```

### Fix 2: Or create service role bypass
The `workbookService.ts:39-47` `createWorkbook()` doesn't set `owner_id`, which would prevent RLS from working even with Supabase Auth:

```typescript
const createWorkbook = async (name: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("workbooks")
    .insert({ name, owner_id: user?.id })  // Add owner_id
    .select()
    .single();
};
```

### Fix 3: Or add permissive policy
```sql
create policy worksheets_public on public.worksheets for select using (true);
```

---

## Verification Result

**Status: REQUIRES MANUAL VERIFICATION**

After running the dev server:
1. Open browser console
2. Click "Inspect" on a workbook
3. Check console for:
   - `INSPECT WORKBOOK ID` - should show UUID
   - `WORKSHEET QUERY ERROR` - will show RLS violation if policy is active
   - `WORKSHEET RESPONSE` - will be empty if RLS blocks

---

## Database Schema Requirements

| Table | Required | Status |
|-------|----------|--------|
| `workbooks` | UUID primary key, `owner_id uuid references auth.users` | Schema exists |
| `worksheets` | UUID primary key, `workbook_id uuid references workbooks` | Schema exists |
| `worksheet_rows` | UUID primary key, `worksheet_id uuid references worksheets` | Schema exists |
| `column_metadata` | UUID primary key, `worksheet_id uuid references worksheets` | Schema exists |
| `user_roles` | `user_id uuid references auth.users`, `workbook_id uuid` | Schema exists |
| `public.users` | Custom table with numeric ID | CONFLICT - RLS expects UUID |

---

## Action Required

Before Dashboard Builder development can proceed:

1. **Immediate:** Either disable RLS on `worksheets` table OR
2. **Long-term:** Migrate to Supabase Auth for workbook access
3. **Critical:** Ensure `createWorkbook()` sets `owner_id` to authenticated user's UUID