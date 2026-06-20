# ER_TRACKER_PROJECT_KNOWLEDGE_BASE.md

---

## SECTION 1 – PROJECT STATUS

| Feature | Status |
|---------|--------|
| Login | ✅ Completed |
| Role Management | ✅ Completed |
| Workbook Import | ✅ Completed |
| Worksheet View | ✅ Completed |
| Dashboard Widget Migration | 🔴 Blocked - dashboard_widgets table missing, users.id schema conflict |
| V5 Neo Fluent Design | ✅ Completed |
| Theme Studio MVP | ✅ Frontend ready, SQL needs manual apply to Supabase |
| Theme Studio Color Fix | ✅ Completed |
| Theme Studio RLS Fix | ✅ Completed |
| Schema Alignment | ✅ Completed |
| Theme System | ✅ Frontend ready, needs database apply |

---

## SECTION 2 – DESIGN SYSTEM V5 (Neo Fluent Enterprise)

**Design System Doc**: `docs/architecture/DESIGN_SYSTEM_V5.md`

---

## SECTION 3 – THEME STUDIO

**SQL Schema**: `supabase/migrations/THEME_STUDIO_SQL.sql`
**Migration**: `supabase/migrations/20260618000000_create_app_themes.sql`

**Features:**
- Create themes with 5 color variables
- Live preview with dual color picker
- Save/Apply themes
- RBAC: frontend handles access
- RLS: permissive policies using created_by field
- CSS variables applied globally via ThemeProvider
- Realtime subscription for instant theme updates

**Status**: ✅ Frontend complete - Apply SQL manually in Supabase Dashboard to enable persistence

---

## SECTION 4 – PROJECT REPORT INDEX

| File Name | Location |
|-----------|----------|
| `SUPABASE_SCHEMA_VERIFICATION_REPORT.md` | `docs/reports/` |
| `MISSING_TABLES_MIGRATION.sql` | `docs/reports/` |
| `THEME_STUDIO_SAVE_FIX_REPORT.md` | `docs/reports/` |
| `THEME_STUDIO_RLS_FIX_REPORT.md` | `docs/reports/` |
| `THEME_STUDIO_RBAC_ALIGNMENT_REPORT.md` | `docs/reports/` |
| `THEME_STUDIO_COLOR_INPUT_FIX_REPORT.md` | `docs/reports/` |
| `THEME_STUDIO_PHASE1_REPORT.md` | `docs/reports/` |
| `WORKSHEET_UI_V5_PREVIEW_REPORT.md` | `docs/reports/` |
| `DASHBOARD_ASSIGNMENT_MIGRATION_REPORT.md` | `docs/reports/` |
| `SCHEMA_UNIFICATION_PLAN.md` | `docs/reports/` |
| `REAL_DATABASE_ALIGNMENT_REPORT.md` | `docs/reports/` |
| `OPTION_A_IMPLEMENTATION_REPORT.md` | `docs/reports/` |
| `MISSING_TABLE_DEPENDENCY_REPORT.md` | `docs/reports/` |
| `DOCUMENTATION_REORGANIZATION_REPORT.md` | `docs/reports/` |
| `APPLY_APP_THEMES_SQL.md` | `docs/reports/` |
| `THEME_DATABASE_FIX_REPORT.md` | `docs/reports/` |
| `WIDGET_ASSIGNMENT_AUDIT.md` | `docs/reports/` |
| `USER_SCHEMA_AUDIT.md` | `docs/reports/` |
| `WIDGET_UUID_FIX_REPORT.md` | `docs/reports/` |
| `BCRYPT_REMOVAL_REPORT.md` | `docs/reports/` |
| `PRESENCE_SYSTEM_AUDIT.md` | `docs/reports/` |
| `DASHBOARD_WIDGET_ASSIGNMENT_AUDIT.md` | `docs/reports/` |
| `USER_PRESENCE_FIX_REPORT.md` | `docs/reports/` |
| `BCRYPT_REMOVAL_REPORT.md` | `docs/reports/` |
| `RECHARTS_FIX_REPORT.md` | `docs/reports/` |
| `FULL_DATABASE_FRONTEND_ALIGNMENT_AUDIT.md` | `docs/reports/` |
| `COMPREHENSIVE_SCHEMA_ALIGNMENT_AUDIT.md` | `docs/reports/` |
| `AUTH_FIX_REPORT.md` | `docs/reports/` |
| `SHEETS_SCHEMA_FIX_REPORT.md` | `docs/reports/` |
| `MISSING_TABLES_DECISION_REPORT.md` | `docs/reports/` |
| `THEME_CRUD_IMPLEMENTATION_REPORT.md` | `docs/reports/` |
| `FINAL_SYSTEM_AUDIT.md` | `docs/reports/` |

---

## SECTION 5 – SCHEMA VERIFICATION

**Report**: `docs/reports/SUPABASE_SCHEMA_VERIFICATION_REPORT.md`

**Missing Tables**: `permission_requests`, `user_presence`, `workspace_notes`, `dashboard_widgets`, `dashboard_widget_assignments`, `audit_logs`

**Migration Script**: `supabase/migrations/MISSING_TABLES_MIGRATION.sql`

---

## SECTION 6 – SCHEMA ALIGNMENT COMPLETE

**Report**: `docs/reports/OPTION_A_IMPLEMENTATION_REPORT.md`

**Result**: Frontend reverted to use `sheets`/`columns` matching actual database

**Tables Used**: `workbooks`, `sheets`, `columns`, `user_roles` - all exist

---

## SECTION 7 – REMAINING ACTION ITEMS

| Table | Purpose | Status |
|-------|---------|--------|
| `dashboard_widgets` | Dashboard widgets | 🔴 **BLOCKED** - Table missing + users.id schema conflict (see `WIDGET_ASSIGNMENT_AUDIT.md`, `DASHBOARD_WIDGET_ASSIGNMENT_AUDIT.md`) |
| `dashboard_widget_assignments` | Widget-to-user assignments | 🔴 **BLOCKED** - Depends on dashboard_widgets table |
| `app_themes` | Theme Studio themes | ✅ SQL READY - Run `supabase/migrations/20260618000000_create_app_themes.sql` in Supabase SQL Editor |
| `audit_logs` | Audit trail | 🔴 **NOT APPLIED** - Migration exists but table missing (see `FULL_DATABASE_FRONTEND_ALIGNMENT_AUDIT.md`) |
| `user_presence` | User presence dashboard | ✅ FIXED - Table exists, auto-detection in service, no 404 errors (see `USER_PRESENCE_FIX_REPORT.md`) |
| `workspace_notes` | Workspace notes | 🔴 **NOT APPLIED** - Migration exists but table missing (see `FULL_DATABASE_FRONTEND_ALIGNMENT_AUDIT.md`) |
| `permission_requests` | Permission requests | Not required - no active usage |

---

## SECTION 8 – DATABASE ARCHITECTURE

### users.id Type Conflict

| Migration File | users.id Type | Notes |
|----------------|---------------|-------|
| `SUPABASE_SCHEMA.sql` (line 66) | **TEXT** | Primary definition used by workbooks/sheets/columns |
| `DATABASE_AUTH_MIGRATION.sql` (line 5) | **UUID** | Creates alternative users table with UUID |
| `20260613000000_create_workspace_assignments.sql` | **BIGINT** (FK) | References users(id) expecting BIGINT |

**Impact**: Frontend code assumes `number` (authHelper) while most migrations use `TEXT` or `BIGINT`.

### user_id Type Mappings

| Table | user_id Type | FK to users.id? |
|-------|--------------|-----------------|
| `user_roles` | TEXT | ✅ (SUPABASE_SCHEMA.sql:47) |
| `audit_logs` | TEXT | ❌ (no FK) |
| `dashboard_widgets` | TEXT | ✅ (SUPABASE_SCHEMA.sql:100,112) |
| `workspace_assignments` | BIGINT | ✅ (20260613000000:8,9) |
| `user_presence` | TEXT (was BIGINT, updated 2026-06-19) | ✅ (20260614000100:6) |
| `permission_requests` | TEXT | ✅ (MISSING_TABLES_MIGRATION.sql:76,78) |
| `workspace_notes` | BIGINT | ✅ (MISSING_TABLES_MIGRATION.sql:61) |

### Recommended Canonical Type: TEXT

Rationale:
- Supabase `auth.uid()` returns TEXT
- Current `SUPABASE_SCHEMA.sql` uses TEXT (widely referenced)
- Allows easier transition from numeric IDs
- Removes FK constraints temporarily until type alignment complete

### Frontend Type Conversions

| File | Conversion | Target Type |
|------|------------|-------------|
| `workspaceService.ts` | `parseInt(userId)` | number |
| `roleService.ts` | `parseInt(userId)` | number |
| `authHelper.ts` | `id: number` | number |
| `presenceService.ts` | `user_id: string` | string (graceful localStorage mode) |
| `DashboardBuilder.tsx` | `String(u.id)` | string (select value) |
| `workspaceService.ts` | `String(u.id)` | string (getAssignableUsers) |

### UUID Type Mismatches

| Table Column | Database Type | Frontend Type | Status |
|--------------|-------------|---------------|--------|
| `dashboard_widgets.workbook_id` | UUID | string | ✅ (from workbooks - UUID) |
| `dashboard_widgets.worksheet_id` | UUID | string (numeric) | ❌ MISMATCH - frontend uses `sheets` table with INTEGER IDs |
| `dashboard_widgets.user_id` | TEXT | string | ✅ |
| `columns.sheet_id` | UUID | string (after parseInt) | ⚠️ `worksheetService.ts:278` uses `parseInt(worksheetId)` |

**Critical:** Frontend queries `sheets` table (INTEGER IDs) but `dashboard_widgets` expects UUID from `worksheets` table.

### Authentication Architecture

**Current Implementation:** Custom authentication (NOT Supabase Auth)

| Component | Method | Notes |
|-----------|--------|-------|
| Login | `users` table lookup + plaintext comparison | `authHelper.ts:loginUser()` |
| Password storage | `hashed_password` column | Plaintext (bcrypt removed) |
| Session | localStorage | No `supabase.auth` calls found |
| User creation | Direct `users` insert | Plaintext password |
| Password reset | Direct `users` update | Plaintext password |

**bcryptjs removed completely** - See `BCRYPT_REMOVAL_REPORT.md` for details.
- Removed from `frontend/package.json`
- Removed from `authHelper.ts` and `userService.ts`
- All hashing replaced with direct string comparison

---

## SECTION 9 – DASHBOARD WIDGET ARCHITECTURE

**Report:** `docs/reports/DASHBOARD_WIDGET_ASSIGNMENT_AUDIT.md`

**Current Issue:** Widgets created per-user (no reuse). `dashboard_widgets` table missing.

**Proposed Schema:**
- `dashboard_widgets` - Widget templates (workbook_id: INTEGER, worksheet_id: INTEGER)
- `dashboard_widget_assignments` - User assignments with ON DELETE CASCADE

**ID Types Required:**
- `workbook_id` → INTEGER (matches `workbooks.id` if INTEGER, or UUID if UUID)
- `worksheet_id` → INTEGER (matches `sheets.id` - currently INTEGER/BIGINT)

**Missing Features:**
- Edit widget configuration (not implemented)
- Delete widget with cascade (not implemented)
- Unassign without delete (button labeled "Unassign" but deletes widget)

---

## SECTION 10 – THEME SYSTEM ARCHITECTURE

### Database Schema

**Table:** `app_themes` (migration: `supabase/migrations/20260618000000_create_app_themes.sql`)

| Column | Type | Default |
|--------|------|---------|
| id | UUID | gen_random_uuid() |
| name | TEXT | - |
| primary_color | TEXT | '#ABE7B2' |
| accent_color | TEXT | '#CBF3BB' |
| background_color | TEXT | '#ECF4E8' |
| surface_color | TEXT | '#FFFFFF' |
| text_color | TEXT | '#1A1A2E' |
| is_active | BOOLEAN | false |
| created_by | TEXT | - |
| created_at | TIMESTAMPTZ | NOW() |

### CSS Variables

```css
:root {
  --primary: #ABE7B2;
  --accent: #CBF3BB;
  --background: #ECF4E8;
  --surface: #FFFFFF;
  --text: #1A1A2E;
  --secondary: #93BFC7;
  --text-secondary: #4A5568;
  --success: #4ADE80;
  --warning: #FBBF24;
  --danger: #F87171;
}
```

### Theme Context

**File:** `frontend/src/context/ThemeContext.tsx`

- `loadActiveTheme()` - Fetches and applies active theme on mount
- `applyCssVariables()` - Sets CSS custom properties on `:root`
- Realtime subscription to `app_themes` table for live updates

### Files Modified (Theme System)

| File | Change |
|------|--------|
| `supabase/migrations/20260618000000_create_app_themes.sql` | Created |
| `frontend/src/context/ThemeContext.tsx` | Created |
| `frontend/src/index.css` | Updated CSS variables |
| `frontend/src/tailwind.config.js` | Dynamic colors |
| `frontend/src/App.tsx` | Added ThemeProvider wrapper |
| `frontend/src/pages/ThemeStudio.tsx` | Integrated with context |
| `frontend/src/components/ui/CyberInput.tsx` | CSS variables |
| `frontend/src/components/ui/CyberSelect.tsx` | CSS variables |
| `frontend/src/components/ui/CyberTable.tsx` | CSS variables |
| `frontend/src/components/ui/CyberColorInput.tsx` | CSS variables |
| `frontend/src/components/Header.tsx` | CSS variables |
| `frontend/src/layouts/MainLayout.tsx` | CSS variables |
| `frontend/src/pages/RoleManagement.tsx` | CSS variables |
| `frontend/src/pages/DashboardBuilder.tsx` | CSS variables |

### Theme Studio — Full CRUD (2026-06-19)

| Operation | Before | After |
|-----------|--------|-------|
| Create | ✅ Working | ✅ Working |
| Edit | ❌ Not available | ✅ Edit button → loads into form → Update Theme |
| Delete | ❌ Not available | ✅ Delete button → confirmation modal → removes from DB |
| Clone | ❌ Not available | ✅ Clone button → creates copy with "(Copy)" suffix |
| Apply | ✅ Working | ✅ Working (improved with refresh) |

**File changed:** `frontend/src/pages/ThemeStudio.tsx` — added editing state, delete modal, clone function, and Actions column with Apply/Edit/Clone/Delete buttons.

**Key design decisions:**
- Disable delete for active themes (must switch to another theme first)
- Clone creates `is_active: false` copies
- Edit loads existing colors, switches button to "Update Theme", shows Cancel
- All operations call `refreshThemes()` for no-refresh UX

**Report:** `docs/reports/THEME_CRUD_IMPLEMENTATION_REPORT.md`

### Remaining Known Limitations

| Component | Hardcoded Colors | Reason |
|-----------|-----------------|--------|
| Dashboard/Charts | `#ABE7B2`, `#CBF3BB` | Chart-specific colors |
| Worksheet forms | `#07111F` | Dark modal backgrounds for contrast |
| Toast notifications | `#00FF9D`, `#FF4D6D` | Cyberpunk design language |

---

## SECTION 11 – DOCUMENTATION POLICY

### File Organization Rules

| Document Type | Location |
|---------------|----------|
| Reports | `docs/reports/` |
| Architecture | `docs/architecture/` |
| SQL Migrations | `supabase/migrations/` |
| Knowledge Base (master) | `docs/archive/ER_TRACKER_PROJECT_KNOWLEDGE_BASE.md` |

All future updates must be made to the appropriate location. Never create reports in project root or duplicate knowledge base files.

---

## SECTION 12 – SINGLE SOURCE OF TRUTH POLICY

**The master project document is:**

`docs/archive/ER_TRACKER_PROJECT_KNOWLEDGE_BASE.md`

All future updates must be appended to this file. Creating additional project knowledge base files is prohibited.

Whenever functionality changes, schema changes, UI changes, reports are generated, or migrations are added, ALWAYS update:

`docs/archive/ER_TRACKER_PROJECT_KNOWLEDGE_BASE.md`

NEVER create:
- A replacement file
- A versioned copy
- A duplicate knowledge base file

---

## SECTION 13 – PRODUCTION STABILIZATION FIX (2026-06-19)

### Issue 1: User Presence 404 Error
- **Root Cause:** `presenceService.ts` had hardcoded `isTableAvailable = false`
- **Fix:** Added auto-detection of `user_presence` table, updated migration to use TEXT types, fixed type mismatches
- **Files Changed:**
  - `supabase/migrations/20260614000100_create_user_presence.sql` (BIGINT → TEXT)
  - `frontend/src/services/presenceService.ts` (auto-detect, numeric IDs)
  - `frontend/src/layouts/MainLayout.tsx` (pass number, not string)
  - `frontend/src/pages/UserPresence.tsx` (numeric comparison)
- **Report:** `docs/reports/USER_PRESENCE_FIX_REPORT.md`
- **Status:** ✅ Fixed

### Issue 2: Bcrypt Removal (Original Fix — SUPERSEDED)
- **Root Cause:** `bcryptjs` uses Node.js `crypto.randomBytes` externalized in Vite browser bundle
- **Original Fix:** Removed bcryptjs entirely, replaced with plaintext password comparison
- **Status:** ❌ SUPERSEDED — See Auth Fix below

### Issue 5: Auth Fix — bcrypt Verification Restored (2026-06-19)
- **Root Cause:** Previous fix removed bcrypt verification; plaintext comparison failed against bcrypt hashes and didn't hash new passwords
- **Fix:** Reinstalled `bcryptjs`, restored bcrypt import in `authHelper.ts`, implemented hybrid verification (bcrypt for `$2`-prefixed hashes, plaintext fallback)
- **Files Changed:**
  - `frontend/src/services/authHelper.ts` (bcrypt import + hybrid compare)
  - `frontend/package.json` (bcryptjs re-added)
  - `frontend/package-lock.json` (auto-generated)
- **Report:** `docs/reports/AUTH_FIX_REPORT.md`
- **Status:** ✅ Fixed

### Issue 3: Recharts width(-1)/height(-1)
- **Root Cause:** `ResponsiveContainer` with `height="100%"` in flex containers without explicit heights
- **Fix:** Changed all `height="100%"` to explicit pixel values, added `minHeight` to parent containers
- **Files Changed:**
  - `frontend/src/pages/DashboardBuilder.tsx` (300px height, min-h-[350px] parent)
  - `frontend/src/pages/Dashboard.tsx` (220px/300px height, minHeight parents)
  - `frontend/src/pages/Reports.tsx` (200px height, minHeight parent)
- **Report:** `docs/reports/RECHARTS_FIX_REPORT.md`
- **Status:** ✅ Fixed

---

## SECTION 14 – FULL DATABASE VS FRONTEND ALIGNMENT AUDIT (2026-06-19)

**Report:** `docs/reports/FULL_DATABASE_FRONTEND_ALIGNMENT_AUDIT.md`

### Critical Findings

| Issue | Severity | Summary |
|-------|----------|---------|
| Login broken after bcrypt removal | 🔴 CRITICAL | ✅ FIXED — Hybrid bcrypt/plaintext verification restored in `authHelper.ts` |
| `audit_logs` table missing | 🔴 HIGH | All audit logging falls back to localStorage silently |
| `workspace_notes` table missing | 🔴 HIGH | Notes/annotations feature non-functional |
| `workbooks.id` type mismatch | 🔴 HIGH | Code expects UUID (string), DB returns INTEGER (number) |
| `sheets.records_table_name` missing column | 🔴 HIGH | ✅ FIXED — All `records_table_name` queries removed from frontend; falls back to static map |

### How Login Was Fixed

1. `Login.tsx` → `AuthContext.login()` → `authHelper.loginUser()`
2. Queries `users` table for matching `username`
3. Returns `hashed_password` from DB
4. **Hybrid verification:** If hash starts with `$2` → `bcrypt.compareSync(password, hash)`, else → `password === hash`
5. `bcryptjs` package reinstalled, import restored
6. **Database was NOT modified** — existing bcrypt hashes and plaintext passwords both work

### Missing Tables — Decision Summary (2026-06-19)

See `docs/reports/MISSING_TABLES_DECISION_REPORT.md` for full analysis.

| Table | Decision | Rationale |
|-------|----------|-----------|
| `audit_logs` | **A — Create table** | Active feature: AuditHistory.tsx + 34 log calls in 5 files |
| `workspace_notes` | **A — Create table** | Active feature: Record notes in Worksheet.tsx |
| `system_roles` | **B — Remove code** | Dead code: `assignSystemRole()` in userService.ts, no UI references |
| `dashboard_assignments` | **B — Remove Supabase query** | Only the localStorage part is active; DB query is dead and already guarded |
| `logs` | N/A | Not referenced |
| `dashboard_widget_assignments` | N/A | Not referenced |

### Actual Database Schema (Live)

| Table | Columns |
|-------|---------|
| `users` | id (number), username, hashed_password, is_active |
| `user_roles` | user_id (number), role_id (number) |
| `roles` | id (number), name, description |
| `role_permissions` | role_id (number), permission_id (number) |
| `permissions` | id (number), name, description |
| `workbooks` | id (number), name, uploaded_at |
| `sheets` | id (number), workbook_id (number), name |
| `columns` | id (number), sheet_id (number), name, inferred_type, is_hidden, display_order |
| `dashboard_widgets` | id (UUID), user_id, title, widget_type, workbook_id (number), worksheet_id (number), ... |
| `user_presence` | user_id (BIGINT), username, status, current_page, current_workbook_id, session_start, last_seen |
| `app_themes` | id (UUID), name, colors..., created_by, is_active |
| `workspace_assignments` | (empty, exists) |

---

## SECTION 15 – COMPREHENSIVE SCHEMA ALIGNMENT AUDIT (2026-06-19)

**Report:** `docs/reports/COMPREHENSIVE_SCHEMA_ALIGNMENT_AUDIT.md`

### New Findings (Beyond Section 14)

#### 7 Additional Missing Tables

| Table | Queries Referencing It | 404 Impact |
|-------|----------------------|------------|
| `dashboard_assignments` | `workbookService.ts:162` | Guarded with `code !== '42P01'`, silently fails on workbook delete |
| `worksheet_rows` | (intended by SUPABASE_SCHEMA.sql) | Never created — replaced by dynamic record tables |
| `column_metadata` | (intended by SUPABASE_SCHEMA.sql) | Never created — renamed to `columns` |
| `worksheets` | (intended by SUPABASE_SCHEMA.sql) | Never created — renamed to `sheets` |

#### Confirmed Missing Columns (3 more beyond Section 14)

| Table | Missing Column | Failing Queries |
|-------|---------------|-----------------|
| `sheets` | `updated_at` | `storageService.ts:334`, `Workbooks.tsx:81` |
| `sheets` | `created_at` | `Workbooks.tsx:81` |
| `workbooks` | `created_at` | `Workbooks.tsx:84` (fallback to Date.now()) |
| `workbooks` | `updated_at` | `Workbooks.tsx:84` (fallback to Date.now()) |
| `workbooks` | `owner_id` | (expected by interface) |
| `workbooks` | `deleted_at` | (expected by interface) |
| `workbooks` | `description` | (expected by interface) |
| `workbooks` | `tags` | (expected by interface) |
| `dashboard_widgets` | `records_table`, `position`, `size`, `width`, `height` | Various 400 errors |
| `users` | `created_at` | (expected by interface) |

#### UUID vs Integer Type Mismatch Count: 12

All primary/foreign keys in the actual database are `INTEGER`, but the frontend declares them as `string`. The most dangerous mismatches are `dashboard_widgets.workbook_id` and `worksheet_id` — previously caused `invalid input syntax for uuid: "22"` error.

#### Cross-Table User ID Type Inconsistency

- `users.id`: INTEGER (9, 17, 18)
- `user_presence.user_id`: BIGINT
- `dashboard_widgets.user_id`: TEXT ("18")
- `dashboard_widgets.created_by`: TEXT ("9")
- `app_themes.created_by`: TEXT

Cross-table joins on `user_id` may fail silently due to INTEGER↔TEXT coercion.

### SUPABASE_SCHEMA.sql Was Never Applied

The file `supabase/migrations/SUPABASE_SCHEMA.sql` declares UUID-based schema that does not match the live database at all:
- All PKs declared as UUID → actual DB uses INTEGER
- `worksheets` → renamed to `sheets` with different columns
- `column_metadata` → renamed to `columns` with different columns
- `worksheet_rows` → replaced by dynamic per-sheet record tables
- `user_roles` with `workbook_id`+`role` → actual table is simpler (only `user_id`+`role_id`)
- `audit_logs`, `workspace_notes` declared but never created

### Broken Code Found

| Function | File | Issue |
|----------|------|-------|
| `assignSystemRole()` | `userService.ts:202-209` | ❌ DECISION B — Dead code, remove |
| `assignWorkbookRole()` | `userService.ts:211-222` | ❌ DECISION B — Dead code, remove (uses columns that don't exist) |
| `discoverRecordsTables()` | ~~`storageService.ts:56-58`~~ | ✅ FIXED — No longer queries `records_table_name`; uses static map |
| `resolveRecordTable()` | ~~`rowService.ts:99-103`~~ | ✅ FIXED — No longer queries `records_table_name`; uses cache/map/fallback |

### Section 14 C-1 (Login Broken) — ✅ FIXED (2026-06-19)

Hybrid bcrypt/plaintext verification restored in `authHelper.ts:94-97`. See `docs/reports/AUTH_FIX_REPORT.md` for details.

### Section 14 C-5 (sheets.records_table_name missing) — ✅ FIXED (2026-06-19)

All 8 frontend queries referencing `records_table_name`, `updated_at`, `created_at` on `sheets` table removed. Services now use `SHEET_TO_RECORD_TABLE` static map, localStorage cache, and `records_{sheetId}` fallback. See `docs/reports/SHEETS_SCHEMA_FIX_REPORT.md` for details.

### All 168 Queries Audited

Every `.from()` call in the frontend (23 files) was cross-checked against the actual database schema. See report for full per-file breakdown of 14 invalid queries across 7 files.

---

## SECTION 16 – FINAL SYSTEM AUDIT (2026-06-19)

### Database Status Change

`audit_logs` table was **created** since prior audit — now present in Supabase (previously 404).

### Remaining Production Blockers (P0)

| Issue | Component | Status |
|-------|-----------|--------|
| `workspace_notes` table missing | Notes feature dead | ❌ UNFIXED |
| `workspace_assignments.sheet_id` missing column | Sheet assignments 400 | ❌ UNFIXED |
| `dashboard_widgets.user_id` (TEXT) vs `users.id` (INTEGER) | Cross-type join risk | ❌ UNFIXED |
| `dashboard_widgets.created_by` (TEXT) vs `users.id` (INTEGER) | Cross-type join risk | ❌ UNFIXED |
| `app_themes.created_by` (TEXT) vs `users.id` (INTEGER) | Cross-type join risk | ❌ UNFIXED |

### Feature Status Summary (after all fixes)

| Feature | Status |
|---------|--------|
| Authentication | ✅ Working |
| User Management | ✅ Working (plaintext passwords) |
| Role Management | ✅ Working |
| Workbook CRUD | ✅ Working |
| Sheet CRUD | ⚠️ Partial (no standalone delete) |
| Records CRUD | ⚠️ Partial (hardcoded table map) |
| Dashboard Builder | ✅ Working |
| Theme Studio | ✅ Full CRUD |
| User Presence | ✅ Working |
| Workspace Notes | ❌ Dead (table missing) |
| Audit Logs | ✅ Working (table now present) |
| Workspace Assignments | ⚠️ Partial (sheet_id broken) |

### P0 Fix Order (Safe)

1. Create `workspace_notes` table
2. Add `sheet_id` column to `workspace_assignments`
3. Normalize `user_id`/`created_by` types across tables

See `docs/reports/FINAL_SYSTEM_AUDIT.md` for full 17-section audit.