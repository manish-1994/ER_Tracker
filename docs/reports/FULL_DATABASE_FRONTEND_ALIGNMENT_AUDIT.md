# FULL DATABASE ↔ FRONTEND ALIGNMENT AUDIT

**Date:** 2026-06-19
**Method:** Direct Supabase REST API introspection + full source code scan

---

## ACTUAL DATABASE SCHEMA

### Tables that EXIST in `public` schema

| Table | Columns (from live data) | Status |
|-------|--------------------------|--------|
| `users` | `id` (number), `username` (string), `hashed_password` (string), `is_active` (boolean) | ✅ |
| `user_roles` | `user_id` (number), `role_id` (number) | ✅ |
| `roles` | `id` (number), `name` (string), `description` (string\|null) | ✅ |
| `role_permissions` | `role_id` (number), `permission_id` (number) | ✅ |
| `permissions` | `id` (number), `name` (string), `description` (string\|null) | ✅ |
| `workbooks` | `id` (number), `name` (string), `uploaded_at` (null) | ✅ |
| `sheets` | `id` (number), `workbook_id` (number), `name` (string), `row_count` (null), `column_names` (null), `col_count` (null) | ✅ |
| `columns` | `id` (number), `sheet_id` (number), `name` (string), `inferred_type` (string), `is_hidden` (boolean), `display_order` (number) | ✅ |
| `dashboard_widgets` | `id` (UUID string), `user_id` (string), `title` (string), `widget_type` (string), `workbook_id` (number), `worksheet_id` (number), `workbook_name` (string), `worksheet_name` (string), `value_col` (string), `value_cols` (array), `group_by_col` (string), `aggregation` (string), `config` (null), `created_by` (string), `created_at` (string) | ✅ |
| `user_presence` | `user_id` (number — BIGINT), `username` (string), `status` (string), `current_page` (string\|null), `current_workbook_id` (string\|null), `session_start` (timestamptz), `last_seen` (timestamptz) | ✅ |
| `app_themes` | `id` (UUID string), `name` (string), `primary_color` (string), `accent_color` (string), `background_color` (string), `surface_color` (string), `text_color` (string), `is_active` (boolean), `created_by` (string), `created_at` (string) | ✅ |
| `workspace_assignments` | EXISTS (empty — columns inferred from migration) | ✅ |
| `records_*` | Multiple tables with `id` (number) + data columns | ✅ |

### Tables that are MISSING (HTTP 404)

| Table | Referenced By | Impact |
|-------|---------------|--------|
| `audit_logs` | `auditService.ts`, `workbookService.ts`, `storageService.ts` | ⚠️ Audit logs silently fail to DB, fall back to localStorage |
| `workspace_notes` | `workspaceService.ts` | ⚠️ Notes/record notes silently fail |
| `dashboard_widget_assignments` | `workbookService.ts` (delete query) | ⚠️ Silently errors on workbook delete |
| `system_roles` | `userService.ts` (`assignSystemRole()`) | 🟢 Dead code — never called |
| `worksheets` | `SUPABASE_SCHEMA.sql` (migration only) | 🟢 Not used in frontend (code uses `sheets`) |
| `worksheet_rows` | `SUPABASE_SCHEMA.sql` (migration only) | 🟢 Not used (code uses `records_*`) |

---

## QUERY-BY-QUERY ALIGNMENT AUDIT

### 1. USERS Table

| File | Query | Expected Type | Actual Type | Status |
|------|-------|---------------|-------------|--------|
| `authHelper.ts:81-85` | `.from("users").select("id, username, hashed_password").eq("username", username).single()` | id: number, username: string, hashed_password: string | id: number, username: string, hashed_password: string | ✅ OK |
| `userService.ts:16-20` | `.from("users").select("id, username, is_active").eq("id", userId).single()` | id: UserId, username: string, is_active: boolean | id: number, username: string, is_active: boolean | ✅ OK |
| `UserManagement.tsx (via getUsers)` | `.from("users").select("id, username, is_active")` | All exist | All exist | ✅ OK |
| `Profile.tsx:27` | `.from("users").select("is_active").eq("id", appUser.id).single()` | is_active: boolean | is_active: boolean | ✅ OK |
| `Dashboard.tsx:155` | `.from("users").select("*", { count: "exact", head: true })` | — | — | ✅ OK |
| `userService.ts:73-80` | `.from('users').insert({ username, hashed_password, is_active })` | All columns exist | All columns exist | ✅ OK |

**CRITICAL FINDING:** `hashed_password` stores bcrypt hashes for existing users (e.g. `$2a$10$SWo0Ers9...`). After bcrypt removal, `loginUser()` now compares plaintext against these bcrypt hashes. **Login is broken for all existing users.** Fix: existing user passwords must be reset to plaintext.

---

### 2. USER_ROLES Table

| File | Query | Expected Type | Actual Type | Status |
|------|-------|---------------|-------------|--------|
| `authHelper.ts:11-14` | `.from("user_roles").select("role_id").eq("user_id", userId)` | role_id: number, user_id: number | role_id: number, user_id: number | ✅ OK |
| `roleService.ts:28-30` | `.from("user_roles").select("*")` | All columns | All columns | ✅ OK |
| `userService.ts:114-115` | `.from("user_roles").select("user_id, role_id")` | All columns | All columns | ✅ OK |
| `userService.ts:141` | `.from('user_roles').delete().eq('user_id', userId)` | user_id column exists | user_id column exists | ✅ OK |

---

### 3. ROLES Table

| File | Query | Status |
|------|-------|--------|
| `authHelper.ts:21-24` | `.from("roles").select("name").in("id", roleIds)` | ✅ OK |
| `roleService.ts:18` | `.from("roles").select("*").order("id")` | ✅ OK |
| `userService.ts:99` | `.from("roles").select("id, name")` | ✅ OK |

---

### 4. ROLE_PERMISSIONS & PERMISSIONS Tables

| File | Query | Status |
|------|-------|--------|
| `authHelper.ts:44-47` | `.from("role_permissions").select("permission_id").in("role_id", roleIds)` | ✅ OK |
| `authHelper.ts:53-56` | `.from("permissions").select("name").in("id", permIds)` | ✅ OK |

---

### 5. WORKBOOKS Table

| File | Query | Expected ID Type | Actual ID Type | Status |
|------|-------|-----------------|----------------|--------|
| `workbookService.ts:22` | `.from("workbooks").select("*")` | `string` (UUID) | `number` | ⚠️ WRONG TYPE |
| `workbookService.ts:28-32` | `.from("workbooks").select("*").eq("id", id)` | `id` param is `string` | `id` is `number` | ⚠️ WRONG TYPE |
| `Dashboard.tsx:153` | `.from("workbooks").select("*", { count: "exact", head: true })` | — | — | ✅ OK |
| `StorageManagement.tsx:433` | `.from("workbooks").select("id")` | string expected | number actual | ⚠️ WRONG TYPE |

**Issue:** `Workbook` type in `workbookService.ts` declares `id: string` but database returns `number`. This works because PostgREST coerces and string/number comparisons often work, but `.eq("id", id)` with a numeric string may fail depending on context. Many places use `String(wb.id)` to work around this.

---

### 6. SHEETS Table (serves as worksheets)

| File | Query | Expected ID Type | Actual ID Type | Status |
|------|-------|-----------------|----------------|--------|
| `worksheetService.ts:31-34` | `.from("sheets").select("*").eq("workbook_id", workbookId)` | `workbook_id` param is `string` | `workbook_id` is `number` | ⚠️ WRONG TYPE |
| `worksheetService.ts:42-44` | `.from("sheets").insert({ workbook_id, name })` | `workbook_id` as string | number | ⚠️ WRONG TYPE |
| `MainLayout.tsx:69` | `.from("sheets").select("workbook_id").eq("id", sheetId)` | sheetId from URL is string | id is number | ⚠️ WRONG TYPE |
| `Worksheet.tsx:436` | `.from("sheets").select("workbook_id").eq("id", parseInt(id))` | uses `parseInt()` | matches number | ✅ OK (explicit coercion) |
| `Workbooks.tsx:81` | `.from("sheets").select("id, workbook_id, ...")` | — | — | ✅ OK |

**Note:** The `sheets` table does NOT have `created_at` or `updated_at` columns. The `Worksheet` type in `worksheetService.ts` declares these as optional, so this is a harmless mismatch. The `records_table_name` column expected by `workbookService.ts:55` and `rowService.ts:99-102` also does NOT exist on `sheets`. This means `discoverRecordsTables()` and `resolveRecordTable()` always fall back to their static `SHEET_TO_RECORD_TABLE` mapping.

---

### 7. COLUMNS Table

| File | Query | Expected Type | Actual Type | Status |
|------|-------|---------------|-------------|--------|
| `worksheetService.ts:64-67` | `.from("columns").select("*").eq("sheet_id", worksheetId)` | sheet_id: string | sheet_id: number | ⚠️ WRONG TYPE |
| `worksheetService.ts:276-279` | `.insert({ sheet_id: parseInt(worksheetId), ... })` | explicit parseInt | number | ✅ OK |

**Note:** `ColumnMetadata` type declares `id: string`, `sheet_id: string` but DB returns `number`. The `getColumns()` function converts via `String(col.id)` and `String(col.sheet_id)`.

---

### 8. DASHBOARD_WIDGETS Table

| File | Query | Expected Type | Actual Type | Status |
|------|-------|---------------|-------------|--------|
| `dashboardWidgetService.ts:22-26` | `.from("dashboard_widgets").select("*").eq("user_id", userId)` | user_id: string | user_id: string | ✅ OK |
| `dashboardWidgetService.ts:37-55` | `.insert({ user_id, workbook_id, worksheet_id, ... })` | workbook_id: string/any, worksheet_id: string/any | workbook_id: number, worksheet_id: number | ⚠️ WRONG TYPE |

**Critical Issue:** `dashboard_widgets.workbook_id` is `number` but code passes string UUIDs. `dashboard_widgets.worksheet_id` is `number` but code passes strings. Supabase/PostgREST may auto-coerce, but this is a latent type mismatch.

---

### 9. USER_PRESENCE Table

| File | Query | Expected Type | Actual Type | Status |
|------|-------|---------------|-------------|--------|
| `presenceService.ts:43-49` | `.from("user_presence").upsert({ user_id, username, ... })` | user_id: number (after fix) | user_id: number (BIGINT) | ✅ OK (after fix) |
| `presenceService.ts:101` | `.delete().eq("user_id", numericId)` | numericId: number | user_id: number | ✅ OK (after fix) |

**Note:** The migration initially used BIGINT for user_id but was updated to TEXT. The actual table still has BIGINT. The code now passes numeric IDs which works with BIGINT.

---

### 10. TABLES THAT DON'T EXIST

#### `audit_logs` — NOT FOUND

| File | Query | Impact |
|------|-------|--------|
| `auditService.ts:59-69` | `.from("audit_logs").insert({...})` | ⚠️ Silently fails, falls back to localStorage |
| `auditService.ts:91-94` | `.from("audit_logs").select("*").order("timestamp", { ascending: false })` | ⚠️ Returns no data |
| `workbookService.ts:239` | `.from("audit_logs").insert({...})` | ⚠️ Silently fails |
| `storageService.ts:396` | `.from("audit_logs").delete()` | ⚠️ Silently fails |

**Type Mismatch:** `auditService.ts:62` does `parseInt(payload.user_id)` — expect BIGINT. But `workbookService.ts:239` passes `effectiveUserId` as string. Inconsistent.

#### `workspace_notes` — NOT FOUND

| File | Query | Impact |
|------|-------|--------|
| `workspaceService.ts:164-168` | `.from("workspace_notes").insert({...})` | ⚠️ Silently fails |
| `workspaceService.ts:179-183` | `.from("workspace_notes").select("*").eq("user_id", intUserId)` | ⚠️ Returns empty |
| `workspaceService.ts:269-272` | `.from("workspace_notes").select("*, users(username)").eq("sheet_id", intSheetId)` | ⚠️ Returns empty |
| `workspaceService.ts:384-389` | `.from("workspace_notes").update({...})` | ⚠️ Silently fails |
| `workspaceService.ts:400-403` | `.from("workspace_notes").delete().eq("id", intNoteId)` | ⚠️ Silently fails |

**Note:** `workspaceService.ts:270` does a join `.select("*, users(username)")` — this requires a FK relationship between `workspace_notes.user_id` and `users.id` to work.

#### `system_roles` — NOT FOUND

| File | Query | Impact |
|------|-------|--------|
| `userService.ts:202-209` | `.from("system_roles").upsert({ user_id, role }, { onConflict: 'user_id' })` | 🟢 Dead code — never called |

---

## CRITICAL ISSUES

### C-1: Login Broken After Bcrypt Removal

**Severity:** CRITICAL — Blocks all user access

**Root Cause:** `authHelper.ts` was changed to compare plaintext passwords, but all existing user passwords in the database are bcrypt hashes (`$2a$10$...`). Every login attempt will fail with "Invalid credentials".

**Fix:** All existing user passwords in the `users.hashed_password` column must be reset to plaintext. Either via direct SQL update or through the user management UI.

### C-2: Missing `audit_logs` Table

**Severity:** HIGH — Audit trail non-functional at database level

**Impact:** All audit logging silently falls back to localStorage. Cross-session audit log visibility is lost. The `auditService.ts` insert at line 62 uses `parseInt(payload.user_id)` which will produce `null` for non-numeric user IDs.

### C-3: Missing `workspace_notes` Table

**Severity:** HIGH — Notes/annotations feature non-functional

**Impact:** Record notes, workspace notes, and all annotation features silently fail against the database (fall back to nothing — no localStorage fallback).

### C-4: `workbooks.id` Type Mismatch (Code expects UUID, DB uses INTEGER)

**Severity:** HIGH — Potential query failures

**Impact:** The `Workbook` type declares `id: string` but database stores `number`. All `.eq("id", id)` queries pass string values. PostgREST may coerce but this is fragile, especially with `.single()` which throws on type mismatch.

### C-5: `sheets.records_table_name` Column Does Not Exist

**Severity:** HIGH — Records table resolution always uses static map

**Impact:** `workbookService.ts:55-56`, `rowService.ts:99-102`, `storageService.ts:57-58` all query `sheets.records_table_name` which doesn't exist. This forces all record table resolution through the hardcoded `SHEET_TO_RECORD_TABLE` mapping in `rowService.ts`.

---

## HIGH PRIORITY ISSUES

### H-1: Dashboard Widget Type Mismatches

`dashboard_widgets.workbook_id` is `number` but code passes string. `dashboard_widgets.worksheet_id` is `number` but code passes string. Currently works via coercion but fragile.

### H-2: `dashboard_widget_assignments` Table Missing

`workbookService.ts:161-166` deletes from `dashboard_assignments` table on workbook delete. This table doesn't exist, so orphaned widget assignments may remain.

### H-3: Bcrypt Hashes in Database

The database still has bcrypt hashes. Any new user created via `userService.ts.createUser()` now stores plaintext, while existing users have bcrypt hashes — inconsistent state.

---

## MEDIUM PRIORITY ISSUES

### M-1: Dead Code — `assignSystemRole()`, `assignWorkbookRole()`

Defined in `userService.ts` lines 202-221 but never called from any file.

### M-2: `auditService.ts` Uses `parseInt()` on String User IDs

Line 62: `parseInt(payload.user_id)` — if user_id is a non-numeric string, this becomes `null`.

### M-3: `Workbook` Type Declares Non-Existent Columns

`workbookService.ts` declares `Workbook` type with `description`, `tags`, `owner_id`, `created_at`, `updated_at`, `deleted_at` — none of which exist in the actual `workbooks` table. These are silently `undefined`.

### M-4: `Worksheet` Type Mismatch

`worksheetService.ts` declares `Worksheet` type with `position`, `created_at`, `updated_at` — none exist in `sheets` table.

### M-5: `getRows()` Uses `parseInt` for `worksheetId`

`rowService.ts:208,278` does `.eq("sheet_id", parseInt(worksheetId))` — the `parseInt` is the correct type, but the function signature accepts `string` (which is correct for URLs).

### M-6: `user_presence` Migration BIGINT vs TEXT

The updated migration file uses TEXT for `user_id` but the actual database still has BIGINT (from the original migration). The code now passes numeric IDs which works, but the migration file and database are out of sync.

---

## SAFE FIX PLAN (Ordered from Safest to Riskiest)

### Phase 1 — Non-Breaking (Safe)

1. **Create missing tables:** Run `supabase/migrations/20260613000100_complete_schema.sql` to create `audit_logs` and `workspace_notes`
2. **Update `sheets.records_table_name`:** Add the `records_table_name` column to `sheets` table
3. **Remove dead code:** Delete `assignSystemRole()` and `assignWorkbookRole()` from `userService.ts`
4. **Clean up type declarations:** Remove non-existent columns from `Workbook` and `Worksheet` TS types

### Phase 2 — Functional Fixes (Moderate Risk)

5. **Reset existing passwords:** Run SQL to convert all bcrypt hashes to plaintext passwords
6. **Create `dashboard_widget_assignments` table:** Migration for proper cascade deletion
7. **Add `created_at`/`updated_at` to `workbooks` and `sheets`:** For accurate timestamps

### Phase 3 — Type Alignment (Higher Risk)

8. **Align `workbooks.id` type:** Either change DB to UUID or change frontend to expect `number`
9. **Align `sheets.id` / `columns.sheet_id`:** Consistent type across all references
10. **Align `user_presence.user_id`:** Apply updated TEXT migration to match actual usage

---

## EXACT FILES REQUIRING MODIFICATION

| File | Issue | Fix |
|------|-------|-----|
| `frontend/src/services/authHelper.ts` | Login broken — bcrypt hashes vs plaintext | Reset all existing passwords to plaintext in DB |
| `frontend/src/services/workbookService.ts` | `Workbook` type has fake columns, `records_table_name` query fails | Remove fake type fields, add `records_table_name` column to `sheets` |
| `frontend/src/services/worksheetService.ts` | `Worksheet` type has fake columns | Remove fake type fields |
| `frontend/src/services/userService.ts` | Dead code (`assignSystemRole`, `assignWorkbookRole`) | Remove unused functions |
| `supabase/migrations/20260613000100_complete_schema.sql` | Needs to be applied | Creates `audit_logs` and `workspace_notes` |
| `supabase/migrations/20260614000100_create_user_presence.sql` | Migration vs DB schema mismatch | Re-run after updating to TEXT, or apply current BIGINT version |
| Database (direct SQL) | Bcrypt hashes in user passwords | Convert to plaintext |
| Database (direct SQL) | Missing `audit_logs`, `workspace_notes`, `records_table_name` column | Create tables/add column |

---

## SUMMARY

| Severity | Count |
|----------|-------|
| 🔴 CRITICAL | 5 |
| 🟠 HIGH | 3 |
| 🟡 MEDIUM | 6 |

**Most urgent:** Login is non-functional for all existing users due to bcrypt hash mismatch. The `audit_logs` and `workspace_notes` tables need to be created for audit trail and notes features to work.
