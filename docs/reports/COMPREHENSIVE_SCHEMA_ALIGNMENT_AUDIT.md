# ER Tracker - Comprehensive Schema Alignment Audit

**Date:** 2026-06-19
**Auditor:** opencode
**Status:** Audit only — no changes made

---

## Section 1 — Login Failure Root Cause

### The Problem

Every existing user login returns **"Invalid credentials"**.

### The Flow

1. `Login.tsx` calls `AuthContext.login()` → `authHelper.loginUser(username, password)`
2. `authHelper.ts:82` queries `users` table: `.eq("username", username).single()`
3. Returns the row `{ id, username, hashed_password }`
4. `authHelper.ts:87` compares: `password === user.hashed_password` **(plaintext comparison)**
5. Actual `hashed_password` value: `$2a$10$SWo0Ers9Cv3jRvju4HzQRO4Spplpdze4KB9iCkk7pJn/i2k11H18K`
6. Plaintext password `manish` !== bcrypt hash → returns `"Invalid credentials"`

### Root Cause

- **Bcrypt was removed** (PR #3 / Issue 2 fix) from `authHelper.ts` and `userService.ts`
- The comparison was changed to plaintext (`password === user.hashed_password`)
- All existing users have bcrypt hashes stored in `hashed_password`
- No migration was run to reset hashes to plaintext
- Backward compatibility: **ZERO** — breaks every existing user account

### Affected Users (Known)

| id | username | hashed_password (truncated) |
|----|----------|---------------------------|
| 9 | Manish | `$2a$10$SWo0Ers9Cv3jRvju4HzQRO4...` |
| 17 | Naisargi | `$2a$10$...` |
| 18 | Arpit | `$2a$10$...` |

### Fix Required

SQL to reset all existing `hashed_password` values to plaintext matching the actual password, OR re-implement bcrypt/hashing.

---

## Section 2 — Missing Tables

The following tables are referenced by frontend code but **do not exist** in the database (all return HTTP 404):

| Table | Referenced By | Query Count | Impact |
|-------|--------------|-------------|--------|
| `audit_logs` | `auditService.ts`, `workbookService.ts`, `storageService.ts`, `UserWorkspace.tsx`, `StorageManagement.tsx` | **7 queries** | Audit trail completely non-functional. Falls back to localStorage silently. |
| `workspace_notes` | `workspaceService.ts` | **6 queries** | Notes/annotations feature dead. Every insert/select/update/delete fails. |
| `system_roles` | `userService.ts` | **1 query** | `assignSystemRole()` (`userService.ts:204`) always throws. Feature non-functional. |
| `dashboard_assignments` | `workbookService.ts` | **1 query** | Guarded by `code !== '42P01'` check, silently fails. |
| `logs` | (potential reference) | — | Does not exist |

Additionally, the **original intended schema** defined in `supabase/migrations/SUPABASE_SCHEMA.sql` declared these tables that were **never created** (or renamed):

| Planned Table | Actual Table | Status |
|--------------|-------------|--------|
| `worksheets` | `sheets` | Renamed |
| `column_metadata` | `columns` | Renamed |
| `worksheet_rows` | (dynamic record tables) | Replaced |
| `user_roles` (with `workbook_id`, `role` columns) | `user_roles` (only `user_id`, `role_id`) | Different structure |

---

## Section 3 — Invalid Queries

### 3.1 — Sheets Queries Failing with HTTP 400

**Root cause:** Three columns queried on `sheets` table **do not exist**:

| Missing Column | HTTP 400? | Frontend Files Affected |
|---------------|-----------|------------------------|
| `records_table_name` | ✅ YES | `workbookService.ts:54,77,170`, `rowService.ts:100,117`, `storageService.ts:57,334`, `Workbooks.tsx:81,91` |
| `updated_at` | ✅ YES | `storageService.ts:334`, `Workbooks.tsx:81` |
| `created_at` | ✅ YES | `Workbooks.tsx:81` |

**Exact failing queries:**

```sql
-- workbookService.ts:54, 77 — fails because records_table_name doesn't exist
SELECT records_table_name FROM sheets WHERE records_table_name IS NOT NULL;

-- workbookService.ts:170 — same
SELECT id, records_table_name FROM sheets WHERE workbook_id = $1;

-- rowService.ts:100 — fails
SELECT id, records_table_name FROM sheets WHERE id = $1;

-- rowService.ts:117 — fails to save
UPDATE sheets SET records_table_name = $1 WHERE id = $2;

-- storageService.ts:57 — fails
SELECT records_table_name FROM sheets WHERE records_table_name IS NOT NULL;

-- storageService.ts:334 — fails (records_table_name AND updated_at both missing)
SELECT id, name, records_table_name, updated_at FROM sheets WHERE workbook_id = $1;

-- Workbooks.tsx:81 — fails (records_table_name, updated_at, created_at all missing)
SELECT id, workbook_id, records_table_name, name, updated_at, created_at FROM sheets;
```

### 3.2 — Workbooks Queries with HTTP 400

| Missing Column | Frontend Files | Impact |
|---------------|----------------|--------|
| `owner_id` | (expected by interface) | Silent field missing |
| `created_at` | `Workbooks.tsx:84` | Falls back to Date.now() |
| `updated_at` | `Workbooks.tsx:84` | Falls back to Date.now() |
| `deleted_at` | (expected by interface) | Soft-delete not supported |
| `description` | (expected by interface) | Silent field missing |
| `tags` | (expected by interface) | Silent field missing |

### 3.3 — Dashboard Widgets Queries with HTTP 400

| Missing Column | Frontend Files | Impact |
|---------------|----------------|--------|
| `records_table` | (some queries) | Silent field missing |
| `position` | (expected by interface) | No widget ordering |
| `size` | (expected by interface) | No widget sizing |
| `width` | (expected by interface) | No widget sizing |
| `height` | (expected by interface) | No widget sizing |

### 3.4 — Users Query with HTTP 400

| Missing Column | Frontend Files | Impact |
|---------------|----------------|--------|
| `created_at` | (expected by interface) | No user creation date tracking |

---

## Section 4 — Data Type Mismatches

### 4.1 — Integer vs UUID/Text Mismatches

| Field | Database (Actual) | Frontend Expects | Risk |
|-------|------------------|-----------------|------|
| `workbooks.id` | `number` (integer: 22) | `string` (UUID) | Works by PostgREST coercion, but `typeof` checks fail |
| `sheets.id` | `number` (integer: 143) | `string` (UUID) | Same coercion risk |
| `sheets.workbook_id` | `number` (integer: 22) | `string` (UUID) | Same |
| `columns.id` | `number` (integer) | `string` (UUID) | Same |
| `columns.sheet_id` | `number` (integer) | `string` (UUID) | Same |
| `roles.id` | `number` (integer) | `string` (UUID) | Same |
| `permissions.id` | `number` (integer) | `string` (UUID) | Same |
| `user_roles.user_id` | `number` (integer) | `string` (text) | Same |
| `user_roles.role_id` | `number` (integer) | `string` (UUID) | Same |
| `dashboard_widgets.workbook_id` | `number` (integer: 22) | `string` (UUID) | **ACTIVE BUG**: previously caused `invalid input syntax for uuid: "22"` |
| `dashboard_widgets.worksheet_id` | `number` (integer: 148) | `string` (UUID) | Same active bug risk |
| `dashboard_widgets.user_id` | `string` (text: "18") | `string` (text) | ✅ OK |
| `dashboard_widgets.created_by` | `string` (text: "9") | `string` (text) | ✅ OK |
| `users.id` | `number` (integer: 9) | `string` (text, per schema) | Unknown — frontend uses numeric IDs in practice |

### 4.2 — Confirmed Active UUID Bug

The `dashboard_widgets` table has:
- `workbook_id` stored as `number` (22)
- `worksheet_id` stored as `number` (148)

But the TypeScript interface `DashboardWidget` declares both as `string`. The previous error `invalid input syntax for uuid: "22"` was caused by PostgREST trying to convert the string "22" to UUID when the column type was UUID. **The column ended up as INTEGER** in the actual database (or PostgREST coerces it), but this is fragile and could reappear if the schema is migrated.

### 4.3 — User ID Type Confusion

- `users.id` is `INTEGER` (number: 9, 17, 18) in the database
- `user_presence.user_id` is `BIGINT` (number)
- `dashboard_widgets.user_id` is `TEXT` (string: "18")
- `dashboard_widgets.created_by` is `TEXT` (string: "9")
- `app_themes.created_by` is `TEXT` (string)
- `workspace_assignments` uses numeric user IDs

This means **cross-table joins on `user_id` may fail** because INTEGER === TEXT comparisons don't match in PostgreSQL without implicit casting.

---

## Section 5 — Broken Services

### 5.1 — `storageService.ts` — Failed to discover tables from sheets metadata

**Root cause chain:**
1. `discoverRecordsTables()` at line 56-58 queries `sheets` for `records_table_name`
2. Column `records_table_name` does not exist → query throws HTTP 400
3. Catch block falls back to 18 hardcoded UUID-based table names (lines 72-91)
4. These hardcoded names likely don't match actual record tables
5. `getDatabaseUsage()` at line 119 counts `audit_logs` — fails silently
6. `getWorkbookAnalysis()` at line 334 queries `records_table_name, updated_at` — fails for every sheet

**Current behavior:** All storage metrics are silently wrong or zero.

### 5.2 — `workbookService.ts` — Deletion cascade broken

1. `deleteWorkbook()` at line 162 tries to delete from `dashboard_assignments` — 404, guarded
2. At line 170, queries for `records_table_name` — fails for all sheets
3. At line 204, tries to delete dynamic record tables — may fail silently
4. `discoverRecordsTables()` at line 54 — same `records_table_name` failure

**Current behavior:** Workbook deletion may leave orphaned data.

### 5.3 — `rowService.ts` — Record table resolution fails

1. `resolveRecordTable()` at line 99-103 queries `records_table_name` — fails
2. Falls back to hardcoded `SHEET_TO_RECORD_TABLE` map (lines 131-132)
3. `saveToDatabase()` at line 117 tries to update `records_table_name` — fails
4. Only works if sheet ID is in the hardcoded map

**Current behavior:** Only works for sheets with IDs in the hardcoded map. New sheets get no record table.

### 5.4 — `auditService.ts` — Complete failure

- Every query to `audit_logs` returns 404
- 7 queries across 5 files all fail silently
- Audit trail exists only in localStorage as a degraded fallback

### 5.5 — `workspaceService.ts` — Notes feature dead

- 6 queries to `workspace_notes` all return 404
- Users cannot create, read, update, or delete workspace notes

### 5.6 — `userService.ts` — System roles and workbook roles broken

- `assignSystemRole()` at line 204 queries `system_roles` — 404
- `assignWorkbookRole()` at line 216-218 inserts into `user_roles` with `workbook_id` and `role` columns — but actual `user_roles` table only has `user_id` and `role_id` columns

---

## Section 6 — Safe Fix Plan

### Phase 1 — Critical (Login Fix + Broken DB)

| Step | What | Risk |
|------|------|------|
| 1 | Reset all `users.hashed_password` to plaintext via Direct SQL | Low — required for login to work |
| 2 | Add `records_table_name` column to `sheets` table | Low — new nullable column |
| 3 | Add `created_at`, `updated_at` columns to `sheets` table | Low — new nullable columns |
| 4 | Add `created_at`, `updated_at` columns to `workbooks` table | Low — new nullable columns |
| 5 | Add missing columns to `users` (`created_at`) | Low |
| 6 | Create `audit_logs` table | Medium — migration may conflict with existing code expectations |
| 7 | Create `workspace_notes` table | Medium — needs correct schema matching frontend expectations |

### Phase 2 — High (UUID/Integer Alignment)

| Step | What | Risk |
|------|------|------|
| 8 | Align TypeScript `DashboardWidget` interface: change `workbook_id` and `worksheet_id` to `number` | Low — type-only change |
| 9 | Audit all `string` ID types in frontend interfaces vs actual `number` types in DB | Medium — may affect query filters |

### Phase 3 — Medium (Deprecated References)

| Step | What | Risk |
|------|------|------|
| 10 | Remove or guard `dashboard_assignments` query in `workbookService.ts` | Low — dead code |
| 11 | Remove or reimplement `assignSystemRole()` and `assignWorkbookRole()` in `userService.ts` | Low — dead/broken code |
| 12 | Add `SHEET_TO_RECORD_TABLE` entries for any new sheets | Low — maintenance |

---

## Section 7 — SQL Required

### 7.1 — Fix User Passwords (Plaintext reset)

```sql
-- Reset all existing bcrypt hashes to plaintext
UPDATE public.users SET hashed_password = 'manish' WHERE id = 9;
UPDATE public.users SET hashed_password = 'naisargi' WHERE id = 17;
UPDATE public.users SET hashed_password = 'arpit' WHERE id = 18;
```

### 7.2 — Add Missing Columns to sheets

```sql
ALTER TABLE public.sheets ADD COLUMN IF NOT EXISTS records_table_name TEXT;
ALTER TABLE public.sheets ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.sheets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
```

### 7.3 — Add Missing Columns to workbooks

```sql
ALTER TABLE public.workbooks ADD COLUMN IF NOT EXISTS owner_id TEXT;
ALTER TABLE public.workbooks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.workbooks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.workbooks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.workbooks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.workbooks ADD COLUMN IF NOT EXISTS tags JSONB;
```

### 7.4 — Add Missing Column to users

```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
```

### 7.5 — Create audit_logs Table

```sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT,
    payload JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
```

### 7.6 — Create workspace_notes Table

```sql
CREATE TABLE IF NOT EXISTS public.workspace_notes (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    sheet_id BIGINT REFERENCES public.sheets(id) ON DELETE CASCADE,
    record_id TEXT,
    content TEXT NOT NULL,
    is_private BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspace_notes_user_id ON public.workspace_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_notes_sheet_id ON public.workspace_notes(sheet_id);
```

---

## Section 8 — Frontend Files Requiring Changes

### Files with Invalid Queries (broken by missing columns)

| File | Line(s) | Issue |
|------|---------|-------|
| `frontend/src/pages/Workbooks.tsx` | 81 | Queries `records_table_name, updated_at, created_at` on `sheets` |
| `frontend/src/pages/Workbooks.tsx` | 84 | References `wb.updated_at, wb.created_at` on workbooks |
| `frontend/src/services/workbookService.ts` | 54-56 | Queries `records_table_name` on `sheets` |
| `frontend/src/services/workbookService.ts` | 77-80 | Queries `records_table_name` on `sheets` |
| `frontend/src/services/workbookService.ts` | 170-172 | Queries `records_table_name` on `sheets` |
| `frontend/src/services/rowService.ts` | 99-103 | Queries `records_table_name` on `sheets` |
| `frontend/src/services/rowService.ts` | 116-119 | Updates `records_table_name` on `sheets` |
| `frontend/src/services/storageService.ts` | 56-58 | Queries `records_table_name` on `sheets` |
| `frontend/src/services/storageService.ts` | 334 | Queries `records_table_name, updated_at` on `sheets` |

### Files with Missing Table References (404)

| File | Line(s) | Missing Table |
|------|---------|--------------|
| `frontend/src/services/auditService.ts` | 60, 92 | `audit_logs` |
| `frontend/src/services/workbookService.ts` | 239 | `audit_logs` |
| `frontend/src/services/storageService.ts` | 257, 396 | `audit_logs` |
| `frontend/src/pages/UserWorkspace.tsx` | 84 | `audit_logs` |
| `frontend/src/pages/StorageManagement.tsx` | 327 | `audit_logs` |
| `frontend/src/services/workspaceService.ts` | 165, 180, 269, 367, 385, 401 | `workspace_notes` |
| `frontend/src/services/userService.ts` | 204 | `system_roles` |
| `frontend/src/services/workbookService.ts` | 162 | `dashboard_assignments` |

### Files with Type Mismatches (string vs number)

| File | Line(s) | Issue |
|------|---------|-------|
| `frontend/src/services/dashboardWidgetService.ts` | 8, 9 | `workbook_id: string` should be `number`; `worksheet_id: string` should be `number` |
| `frontend/src/services/dashboardWidgetService.ts` | 43, 44 | Passes string IDs to DB that expects numbers |
| `frontend/src/services/rowService.ts` | 99 | Passes `sheetId` as string to `.eq("id", sheetId)` — works by coercion |
| `frontend/src/services/worksheetService.ts` | 65, 89 | `sheet_id` passed as string |
| `frontend/src/services/userService.ts` | 37 | `userId` as string |
| `frontend/src/services/workspaceService.ts` | 61, 75, 89 | `intUserId` — parseInt applied, expects number |

### Dead/Broken Code

| File | Line(s) | Function | Action |
|------|---------|----------|--------|
| `frontend/src/services/userService.ts` | 202-209 | `assignSystemRole()` | Remove or reimplement |
| `frontend/src/services/userService.ts` | 211-222 | `assignWorkbookRole()` | Remove or reimplement (inserts `workbook_id` and `role` into `user_roles` which doesn't have those columns) |
| `frontend/src/services/workbookService.ts` | 155-167 | `dashboard_assignments` delete | Remove dead code or create table |
| `frontend/src/services/storageService.ts` | 72-91 | Hardcoded UUID-based record table fallback | Verify against actual records tables |

---

## Appendix A — Actual Database Schema (Live)

```
═══════════════════════════════════════════════════════════════
                    LIVE DATABASE SCHEMA
═══════════════════════════════════════════════════════════════

users
 ├── id            INTEGER (PK)    9, 17, 18
 ├── username      TEXT             Manish, Naisargi, Arpit
 ├── hashed_password TEXT           bcrypt hashes (currently)
 └── is_active     BOOLEAN          true

user_roles
 ├── user_id       INTEGER (FK → users.id)
 └── role_id       INTEGER (FK → roles.id)

roles
 ├── id            INTEGER (PK)    1, 2
 ├── name          TEXT             admin, user
 └── description   TEXT

permissions
 ├── id            INTEGER (PK)
 ├── name          TEXT
 └── description   TEXT

role_permissions
 ├── role_id       INTEGER (FK → roles.id)
 └── permission_id INTEGER (FK → permissions.id)

workbooks
 ├── id            INTEGER (PK)    22, 23, ...
 ├── name          TEXT             ER - Weekly Update Sheet.xlsx
 └── uploaded_at   TIMESTAMPTZ

sheets
 ├── id            INTEGER (PK)    143, ...
 ├── workbook_id   INTEGER (FK → workbooks.id)
 ├── name          TEXT             Fatima April Sheet
 ├── row_count     INTEGER
 ├── column_names  JSONB
 └── col_count     INTEGER

columns
 ├── id            INTEGER (PK)
 ├── sheet_id      INTEGER (FK → sheets.id)
 ├── name          TEXT
 ├── inferred_type TEXT
 ├── is_hidden     BOOLEAN
 └── display_order INTEGER

dashboard_widgets
 ├── id            UUID (PK)       4b972e64-...
 ├── user_id       TEXT
 ├── title         TEXT
 ├── widget_type   TEXT             kpi, pie, bar, ...
 ├── workbook_id   INTEGER         22
 ├── worksheet_id  INTEGER         148
 ├── workbook_name TEXT
 ├── worksheet_name TEXT
 ├── value_col     TEXT
 ├── value_cols    JSONB
 ├── group_by_col  TEXT
 ├── aggregation   TEXT             count, sum, avg, none
 ├── config        JSONB
 ├── created_by    TEXT
 └── created_at    TIMESTAMPTZ

user_presence
 ├── user_id           BIGINT
 ├── username          TEXT
 ├── status            TEXT
 ├── current_page      TEXT
 ├── current_workbook_id TEXT
 ├── session_start     TIMESTAMPTZ
 └── last_seen         TIMESTAMPTZ

app_themes
 ├── id               UUID (PK)
 ├── name             TEXT
 ├── primary_color    TEXT
 ├── accent_color     TEXT
 ├── background_color TEXT
 ├── surface_color    TEXT
 ├── text_color       TEXT
 ├── is_active        BOOLEAN
 ├── created_by       TEXT
 └── created_at       TIMESTAMPTZ

workspace_assignments
  (empty table — structure unknown)

═══════════════════════════════════════════════════════════════
              TABLES THAT DO NOT EXIST (404)
═══════════════════════════════════════════════════════════════

  audit_logs                   ✗ 7 queries reference this
  workspace_notes              ✗ 6 queries reference this
  system_roles                 ✗ 1 query references this
  dashboard_assignments        ✗ 1 query references this
  logs                         ✗ (not referenced)
  dashboard_widget_assignments ✗ (not referenced directly)
  worksheets                   ✗ (renamed to sheets)
  column_metadata              ✗ (renamed to columns)
  worksheet_rows               ✗ (replaced by dynamic tables)

═══════════════════════════════════════════════════════════════
```

## Appendix B — Original Intended Schema vs Actual Schema

| Table | SUPABASE_SCHEMA.sql declares | Actual Database | Delta |
|-------|---------------------------|----------------|-------|
| users | id=TEXT, username, hashed_password, is_active, created_at | id=INTEGER, username, hashed_password, is_active | Type: TEXT→INTEGER; Missing: created_at |
| workbooks | id=UUID, name, owner_id=TEXT, created_at, updated_at, deleted_at | id=INTEGER, name, uploaded_at | Type: UUID→INTEGER; Missing: owner_id, created_at, updated_at, deleted_at; Extra: uploaded_at |
| worksheets → sheets | id=UUID, workbook_id=UUID, title, position, created_at, updated_at | id=INTEGER, workbook_id=INTEGER, name, row_count, column_names, col_count | Complete redesign |
| column_metadata → columns | id=UUID, worksheet_id=UUID, name, display_name, data_type, "order" | id=INTEGER, sheet_id=INTEGER, name, inferred_type, is_hidden, display_order | Complete redesign |
| worksheet_rows | id=UUID, worksheet_id=UUID, data=JSONB, created_at, updated_at | (dynamic tables per sheet) | Replaced entirely |
| user_roles | id=UUID, user_id=TEXT, workbook_id=UUID, role=TEXT, created_at | user_id=INTEGER, role_id=INTEGER | Simplified to just mapping |
| dashboard_widgets | (not in schema file) | id=UUID, user_id=TEXT, workbook_id=INTEGER, worksheet_id=INTEGER, ... | Integer FKs instead of UUID |

---

*End of audit report — no changes were made to the database or frontend.*
