# Missing Tables — Decision Report

**Date:** 2026-06-19
**Type:** Audit only — no changes made

---

## Decision Summary

| Missing Table | Decision | Action |
|--------------|----------|--------|
| `audit_logs` | **A — Create table** | Feature is active across 5 files |
| `workspace_notes` | **A — Create table** | Record notes feature is active in Worksheet.tsx |
| `system_roles` | **B — Remove code** | Dead function, no UI references |
| `dashboard_assignments` | **B — Remove Supabase query** | localStorage part is active; DB query is dead code |
| `logs` | N/A | Not referenced in frontend |
| `dashboard_widget_assignments` | N/A | Not referenced in frontend |
| `worksheets` | N/A | Renamed to `sheets` — functionally replaced |
| `column_metadata` | N/A | Renamed to `columns` — functionally replaced |
| `worksheet_rows` | N/A | Replaced by dynamic record tables |

---

## Table 1: `audit_logs` — ✅ CREATE TABLE (Decision A)

### Feature Status: **ACTIVE**

The audit logging feature is deeply integrated across the application:

| File | Lines | Usage |
|------|-------|-------|
| `frontend/src/services/auditService.ts` | Full file | Core service: `logAudit()`, `getAllAuditLogs()`, `getAuditLogs()`, `getRecordAuditLogs()` |
| `frontend/src/pages/AuditHistory.tsx` | Full page (171 lines) | Dedicated audit log viewer with search, filter, and display UI |
| `frontend/src/pages/Worksheet.tsx` | 22, 409, 583, 616, 682, 696, 730, 789, 814, 835, 868, 911, 964, 1002, 1045, 1066 | Row CRUD logging, record audit timeline |
| `frontend/src/pages/DashboardBuilder.tsx` | 324, 348 | Widget creation audit logging |
| `frontend/src/pages/StorageManagement.tsx` | 156, 180, 204, 220, 240, 251, 262, 273, 287, 311, 341 | Storage operations audit logging |
| `frontend/src/pages/RoleManagement.tsx` | 11 | Role management audit logging |
| `frontend/src/services/workbookService.ts` | 239 | Workbook deletion audit logging |
| `frontend/src/services/storageService.ts` | 257, 396 | Storage usage metrics & purge operations |

### Current Degraded Behavior

- `auditService.ts:50-56` writes to localStorage as fallback
- `auditService.ts:58-73` attempts Supabase insert — fails silently (404)
- `auditService.ts:90-113` attempts Supabase select — fails silently, falls back to localStorage

### Recommendation

Create the `audit_logs` table with this schema matching the frontend expectations:

```sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    payload JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
```

---

## Table 2: `workspace_notes` — ✅ CREATE TABLE (Decision A)

### Feature Status: **ACTIVE**

The record notes feature allows users to attach notes to individual data records in worksheets:

| File | Lines | Usage |
|------|-------|-------|
| `frontend/src/services/workspaceService.ts` | 151-405 | Core service: `createWorkspaceNote()`, `getWorkspaceNotes()`, `getRecordNotes()`, `createRecordNote()`, `updateRecordNote()`, `deleteRecordNote()` |
| `frontend/src/pages/Worksheet.tsx` | 23, 724-738, 773, 809, 833 | Record detail panel with public/private notes, create/edit/delete UI |

### Current Degraded Behavior

- All 6 workspace_notes queries fail with 404
- Notes cannot be created, read, updated, or deleted
- No localStorage fallback — data is permanently lost

### Recommendation

Create the `workspace_notes` table with this schema matching the frontend queries:

```sql
CREATE TABLE IF NOT EXISTS public.workspace_notes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    sheet_id BIGINT REFERENCES public.sheets(id) ON DELETE CASCADE,
    record_id TEXT,
    workbook_id BIGINT REFERENCES public.workbooks(id) ON DELETE CASCADE,
    assignment_id BIGINT,
    is_private BOOLEAN NOT NULL DEFAULT false,
    content TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_notes_user_id ON public.workspace_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_notes_sheet_record ON public.workspace_notes(sheet_id, record_id);
CREATE INDEX IF NOT EXISTS idx_workspace_notes_private ON public.workspace_notes(is_private);
```

---

## Table 3: `system_roles` — ❌ REMOVE CODE (Decision B)

### Feature Status: **DEAD**

| File | Lines | Usage |
|------|-------|-------|
| `frontend/src/services/userService.ts` | 202-209 | `assignSystemRole()` function only |

### Evidence of Dead Code

1. **No UI references.** `grep` for `assignSystemRole` across all `.tsx` files returns zero results.
2. **No page imports it.** No component imports or calls this function.
3. **No route uses it.** The function is defined but never invoked.
4. **Expected table `system_roles` doesn't exist** in actual database or in any migration file.
5. **No other references.** The export `assignSystemRole` is unused anywhere in the codebase.

### Recommendation

Remove the function and its export:

```
frontend/src/services/userService.ts:202-209
  - Remove `assignSystemRole()` function entirely
```

Note: `assignWorkbookRole()` (lines 211-222) is a separate but similarly dead function. It inserts into `user_roles` with columns `workbook_id` and `role` that don't exist in the actual table. Consider removing it as part of the same cleanup.

---

## Table 4: `dashboard_assignments` — ❌ REMOVE SUPABASE QUERY (Decision B)

### Feature Status: **ACTIVE (localStorage) / DEAD (Supabase)**

| File | Lines | Usage |
|------|-------|-------|
| `frontend/src/services/workbookService.ts` | 113-126 | **Active:** Reads/writes `dashboard_assignments` from localStorage to track widget assignments |
| `frontend/src/services/workbookService.ts` | 128-131 | **Dead:** Supabase query `.from("dashboard_assignments").delete()` — guarded with `code !== '42P01'` |

### Evidence

The Supabase query at line 128-131 is already harmlessly guarded:
```typescript
const { error: dashError } = await supabase
  .from("dashboard_assignments")
  .delete()
  .eq("workbook_id", workbookId);
if (dashError && dashError.code !== '42P01') {
  console.warn("Dashboard assignments deletion warning:", dashError);
}
```

The `42P01` check catches the "relation does not exist" error and suppresses it. However, the query still runs on every workbook deletion, consuming a network round trip.

### Recommendation

Remove the Supabase query (lines 128-131). Keep the localStorage logic (lines 113-126) which is the actual active feature.

---

## Tables 5-9: Not Referenced — No Action Needed

| Table | Status | Reason |
|-------|--------|--------|
| `logs` | Not referenced | No frontend code references it |
| `dashboard_widget_assignments` | Not referenced | No frontend code references it |
| `worksheets` | Functionally replaced | Renamed to `sheets` — frontend uses `sheets` table |
| `column_metadata` | Functionally replaced | Renamed to `columns` — frontend uses `columns` table |
| `worksheet_rows` | Functionally replaced | Replaced by dynamic per-sheet record tables; no active frontend queries |

No action needed for these tables.

---

## Action Items Summary

| Priority | Action | Details |
|----------|--------|---------|
| 🔴 HIGH | Create `audit_logs` table | Enables 34+ audit log calls across 5 files to work |
| 🔴 HIGH | Create `workspace_notes` table | Enables record notes feature in Worksheet.tsx |
| 🟡 MEDIUM | Remove `assignSystemRole()` | Dead code in `userService.ts:202-209` |
| 🟡 MEDIUM | Remove `assignWorkbookRole()` | Dead code in `userService.ts:211-222` (uses columns that don't exist) |
| 🟢 LOW | Remove `dashboard_assignments` Supabase query | Dead code in `workbookService.ts:128-130` (already guarded) |
