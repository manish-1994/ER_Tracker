# ER_TRACKER_PROJECT_KNOWLEDGE_BASE.md

---

## SECTION 1 – PROJECT OVERVIEW

**Project Name**: ER Tracker

**Purpose**: Provide a low‑code Excel‑style dashboard editor where users can upload workbooks, view worksheets, edit rows and columns, and track changes.

**Business Use Case**: Enables non‑technical teams to manage and visualize tabular data without needing a full spreadsheet application. Ideal for internal reporting, KPI dashboards, and data‑driven decision making.

**End Users**:
- Business analysts
- Product managers
- Operations staff
- Administrators / SuperAdmins

**Current Architecture**:
```
Frontend (React + Vite)
  ↓
Supabase (PostgreSQL + Auth + RLS)
```
The application is now a pure React + Vite frontend communicating directly with Supabase. No FastAPI code is required for core functionality.

---

## SECTION 2 – PROJECT STATUS

| Feature | Status |
|---------|--------|
| Login | ✅ Completed |
| Role Management | ✅ Completed |
| Workbook Import | ✅ Completed |
| Workbook List | ✅ Completed |
| Worksheet View | ✅ Completed |
| Add Row | ✅ Completed |
| Delete Row | ✅ Completed |
| Inline Cell Edit | ✅ Completed |
| Header Rename | ✅ Completed |
| Audit Logs | ✅ Completed |
| Full FastAPI removal | ✅ Completed |
| Deployment automation | ⚪ Planned |

---

## SECTION 3 – ARCHITECTURE

**Frontend**: React (TSX) with Vite, Tailwind CSS, custom hooks and context for auth.

**Backend**: FastAPI code has been fully removed from the production flow; the UI communicates directly with Supabase.

**Supabase**:
- PostgreSQL database
- Auth (email/password) via Supabase client
- Row‑level security (RLS) policies for `user_roles`
- Storage for workbook files (not shown in code)

**Authentication**: Supabase `supabase.auth` – JWT stored in local storage, refreshed automatically.

**RBAC**: `user_roles` table defines `owner`, `editor`, `viewer` per workbook; RLS enforces row‑level access.

**Audit Logs**: `audit_logs` table records INSERT/UPDATE/DELETE actions.

*Diagram (simplified)*
```
[Browser] <--HTTPS--> [Vite Dev Server] <--JS SDK--> [Supabase]
```

---

## SECTION 4 – DATABASE STRUCTURE

| Table | Purpose | Primary Keys | Foreign Keys | Relationships |
|-------|---------|--------------|--------------|---------------|
| `workbooks` | Workbook metadata | `id` (uuid) | `owner_id` → `auth.users.id` | One‑to‑many → `worksheets` |
| `worksheets` | Worksheet metadata | `id` (uuid) | `workbook_id` → `workbooks.id` | One‑to‑many → dynamic `records_<uuid>` |
| `column_metadata` | Column (header) definitions per worksheet | `id` (uuid) | `worksheet_id` → `worksheets.id` | One‑to‑many → rows (via column names) |
| `records_<uuid>` *(dynamic)* | Actual row data for a specific worksheet (JSON columns) | `id` (uuid) | `worksheet_id` stored on sheet record | Linked to a single `worksheet` |
| `user_roles` | RBAC mapping of users to workbooks | `id` (uuid) | `user_id` → `auth.users.id`<br>`workbook_id` → `workbooks.id` | Many‑to‑one to both Users and Workbooks |
| `audit_logs` | Audit trail of data changes | `id` (uuid) | `user_id` → `auth.users.id` | Independent, references `table_name` & `record_id` |
| `worksheet_rows` | Legacy JSONB rows table – **unused** | `id` (uuid) | `worksheet_id` → `worksheets.id` | None (legacy) |

---

## SECTION 5 – FILE MAP

### Frontend (src/)
| Path | Purpose | Key Functions |
|------|---------|----------------|
| `pages/Workbooks.tsx` | List all workbooks for the current user | `fetchWorkbooks`, UI table rendering |
| `pages/Worksheet.tsx` | Display a single worksheet (grid) | `loadWorksheet`, `loadRows`, cell editors |
| `pages/Dashboard.tsx` | Home screen with recent workbooks and stats |
| `pages/Profile.tsx` | User profile & password change |
 | `pages/RoleManagement.tsx` | UI for assigning roles to users |
 | `context/AuthContext.tsx` | Auth provider, now stores `userRoles` and `loading` |
 | `components/ProtectedRoute.tsx` | Route guard, now respects `loading` and role checks |
 | `layouts/MainLayout.tsx` | Navigation updated to show admin links based on `userRoles` |
| `services/workbookService.ts` | Supabase CRUD for workbooks & worksheets |
| `services/worksheetService.ts` | Fetch worksheet metadata, column metadata |
| `services/rowService.ts` | Dynamic `records_<uuid>` CRUD (add, delete, update) |
| `services/roleService.ts` | `getRoles`, `addRole`, `updateRole`, `removeRole` |
| `services/auditService.ts` | Pull audit log entries for a workbook |
| `services/supabaseClient.ts` | Instantiates Supabase client from env vars |
| `services/userService.ts` | Placeholder user management API (createUser, getUsers, deleteUser, updateUser, activateUser, deactivateUser, assignSystemRole, assignWorkbookRole) |
| `components/*` | Re‑usable UI components (Button, Card, Modal, etc.) |
| `layouts/MainLayout.tsx` | Application layout with navigation |
| `hooks/*` | Custom React hooks (e.g., UI helpers) |

---

## SECTION 6 – FEATURE MAP

### Workbook Import
- **How it works**: User selects an `.xlsx` file, the front‑end parses it (via `excel_parser` on the backend) and calls `create_workbook` which creates `workbooks`, `worksheets`, `column_metadata` and a dynamic `records_<uuid>` table.
- **Files**: `pages/WorkbookImport.tsx` (UI), `services/workbookService.ts` (API calls), `backend/app/services/excel_parser.py` (parsing).
- **Tables**: `workbooks`, `worksheets`, `column_metadata`, `records_<uuid>`.

### Worksheet Viewer
- **How it works**: Loads worksheet metadata and column definitions, then fetches rows from the dynamic records table.
- **Files**: `pages/Worksheet.tsx`, `services/worksheetService.ts`, `services/rowService.ts`.
- **Tables**: `worksheets`, `column_metadata`, `records_<uuid>`.

### Row Management (Add / Delete / Inline Edit)
- **How it works**: Calls `rowService` functions which resolve the correct `records_<uuid>` table and execute INSERT/UPDATE/DELETE statements.
- **Files**: `services/rowService.ts`, UI components in `pages/Worksheet.tsx`.
- **Tables**: Dynamic `records_<uuid>`.

### Header Rename
- **How it works**: Updates `column_metadata.name` and `display_name` for the worksheet.
- **Files**: `services/worksheetService.ts` (update column endpoint).
- **Tables**: `column_metadata`.

### RBAC (Role Management)
 - **How it works**: CRUD on `user_roles` via `roleService`; Supabase RLS restricts access based on role. AuthContext now loads `userRoles` and ProtectedRoute enforces role checks.
 - **Files**: `pages/RoleManagement.tsx`, `services/roleService.ts`, `context/AuthContext.tsx`, `components/ProtectedRoute.tsx`, `layouts/MainLayout.tsx`.
 - **Tables**: `user_roles`.
 - **Current Status**: ✅ Role enforcement implemented (client side).
### User Management Service
- **Purpose**: Provide API surface for user CRUD and role assignment used by the SuperAdmin UI.
- **How it works**: Functions are placeholders that will eventually call Supabase admin APIs to manage users and their system roles.
- **Files**: `services/userService.ts`.
- **Database tables involved**: `auth.users`, `system_roles`, `user_roles`.
- **Dependencies**: Supabase client.
- **Current Status**: ✅ Placeholder implementations added; UI imports fixed.

### Audit Trail
- **How it works**: Backend writes entries to `audit_logs`; front‑end reads via `auditService`.
- **Files**: `services/auditService.ts`, UI in `pages/AuditLogs.tsx`.

---

## SECTION 7 – USER ROLES & PERMISSIONS MATRIX
| Role | Can View Workbooks | Can Edit Worksheets | Can Manage Roles | Can Delete Rows |
|------|-------------------|---------------------|------------------|-----------------|
| Viewer | ✅ | ❌ | ❌ | ❌ |
| Editor | ✅ | ✅ (add/edit rows, rename headers) | ❌ | ✅ |
| Owner | ✅ | ✅ | ✅ (assign/revoke roles) | ✅ |
| SuperAdmin | ✅ (all workbooks) | ✅ (all worksheets) | ✅ (global) | ✅ |

---

## SECTION 8 – SUPABASE CONFIGURATION
- **Environment Variables** (set in `.env`):
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_SUPABASE_SERVICE_ROLE_KEY` (used by scripts only)
- **Required Tables**: all tables listed in Section 4.
- **RLS Policies** (simplified):
  - `user_roles` policies restrict SELECT/INSERT/UPDATE/DELETE to the user’s role for the specific `workbook_id`.
  - Row tables inherit the worksheet’s `workbook_id` via a trigger; policies reference `user_roles`.
  - `audit_logs` is readable by any authenticated user but writes are limited to service role.

---

## SECTION 9 – DEPLOYMENT GUIDE
### Local Development
1. Clone repo.
2. Run `npm install` in `frontend/` and `pip install -r backend/requirements.txt`.
3. Create a `.env` in `backend/` with Supabase credentials.
4. Start Supabase locally (`supabase start`) or point to a remote project.
5. Run `npm run dev` for the Vite dev server.
6. Use `uvicorn backend/app/main:app --reload` for any legacy API needed.

### Production Deployment
- **Frontend**: Deploy to Vercel (or Netlify) – connect repo, set the Vite env vars.
- **Supabase**: Apply `SUPABASE_SCHEMA.sql` and `SUPABASE_RLS.sql` via the Supabase Dashboard or CLI.
- **Backend (optional)**: Deploy FastAPI container to Railway/Docker if legacy endpoints are required.

---

## SECTION 10 – KNOWN ISSUES
- Legacy `worksheet_rows` table still exists but is unused – can be safely dropped.
- Some UI components still reference `import.meta.env.VITE_API_BASE_URL`; they are logged but not used.
- Row ordering is based on insertion time – no explicit sort column yet.
- Large workbooks (>10 k rows) cause performance lag in the grid component.
- Auth migration to Supabase completed; remaining FastAPI `api` service imports are legacy and not used for auth.

---

## SECTION 11 – PROJECT HISTORY
## SECTION 11 – PROJECT HISTORY
| Date | Phase | Task | Files Changed | Result |
|------|-------|------|----------------|--------|
| 2026-05-20 | Phase 2G | Hook Order Fix | `HOOK_ORDER_FIX_REPORT.md` | ✅ Fixed middleware order |
| 2026-06-05 | Phase 2J | FastAPI Removal Audit | `FASTAPI_REMOVAL_AUDIT.md` | 🟡 In Progress |
| 2026-06-10 | Phase 3 | Role/User Migration | `frontend/src/pages/RoleManagement.tsx`, `ROLE_USER_MIGRATION_REPORT.md` | ✅ Role CRUD migrated to Supabase |
| 2026-06-10 | Phase 3 | Supabase Auth V2 Migration | `frontend/src/context/AuthContext.tsx`, `SUPABASE_V2_AUTH_FIX_REPORT.md` | ✅ Updated auth APIs |
 | 2026-06-10 | Phase 3 | Role Enforcement Implementation | `frontend/src/context/AuthContext.tsx`, `frontend/src/components/ProtectedRoute.tsx`, `frontend/src/layouts/MainLayout.tsx`, `ROLE_ENFORCEMENT_IMPLEMENTATION_REPORT.md` | ✅ Implemented client‑side RBAC |
| 2026-06-10 | Phase 3 | Supabase Auth Listener Fix | `frontend/src/context/AuthContext.tsx`, `SUPABASE_V2_AUTH_LISTENER_FIX_REPORT.md` | ✅ Corrected listener cleanup |
---

## SECTION 12 – FUTURE ROADMAP
| Item | Priority | Estimated Complexity |
|------|----------|-----------------------|
| Optimize large worksheet rendering | High | Medium |
| Complete removal of legacy FastAPI auth code | Medium | Low |
| Add real‑time collaboration (Supabase Realtime) | Medium | High |
| Final removal of remaining FastAPI service files (`api.ts`, `appConfig.ts`) after verification | Medium | Low |
## SECTION 13 – CONVERSATION HANDOFF
### START HERE
The **ER Tracker** project is a React + Vite front‑end that talks directly to Supabase for authentication, RBAC, and all data operations (workbooks, worksheets, dynamic row tables, column metadata, and audit logs). No runtime FastAPI dependency exists for the core UI. The repository contains a small legacy FastAPI code‑base that can be removed after final verification. Use the Supabase client (`supabaseClient.ts`) together with the service files (`workbookService.ts`, `worksheetService.ts`, `rowService.ts`, `roleService.ts`, `auditService.ts`) to interact with the database. The data model includes dynamic `records_<uuid>` tables per worksheet and a static `column_metadata` table for headers. RBAC is enforced via the `user_roles` table and Supabase RLS policies. The project is ready for deployment on Vercel with Supabase hosting.

---

## SECTION 14 – AI ASSISTANT HANDOFF

**Current Architecture**: Frontend (React/Vite) → Supabase (PostgreSQL, Auth, RLS). Minimal FastAPI legacy.

**Current Phase**: In‑Progress fastapi removal, deployment automation planned.

**Completed Features**: Login, Role Management, Workbook Import/List, Worksheet View, Row CRUD, Inline Edit, Header Rename, Audit Logs.

**Open Tasks**: Full FastAPI removal, deployment CI/CD, performance optimisation for large worksheets.

**Known Issues**: Legacy `worksheet_rows` table unused, UI env var references, row ordering, large workbook lag.

**Next Recommended Task**: Optimize large worksheet rendering.

**Critical Files**: `frontend/src/pages/Worksheet.tsx`, `frontend/src/services/rowService.ts`, `frontend/src/services/supabaseClient.ts`, `SUPABASE_RLS.sql`.

**Recent Reports To Read**: `SUPABASE_VERIFICATION_REPORT.md`, `FASTAPI_REMOVAL_AUDIT.md`.

---

## SECTION 15 – PROJECT REPORT INDEX

| File Name | Purpose | Date | Phase | Status | Key Findings |
|-----------|---------|------|-------|--------|--------------|
| AUDIT_TRAIL_PHASE2G_REPORT.md | Audit Trail verification | 2026-05-20 | Phase 2G | ✅ Completed | Confirmed audit logging works |
| FASTAPI_REMOVAL_AUDIT.md | FastAPI dependency audit | 2026-06-05 | Phase 2J | 🟡 In Progress | Core features no longer need FastAPI |
| SUPABASE_VERIFICATION_REPORT.md | Supabase setup verification | 2026-04-15 | Phase 2A | ✅ Completed | All RLS policies functional |
| ROLE_SYSTEM_AUDIT.md | Role system audit | 2026-04-30 | Phase 2B | ✅ Completed | RBAC enforced correctly |
| USER_SERVICE_REPAIR_REPORT.md | User service export mismatch repair | 2026-06-10 | Phase 3 | ✅ Completed | Added missing exports, updated imports, build verified |
 | ROLE_ENFORCEMENT_IMPLEMENTATION_REPORT.md | Role enforcement implementation report | 2026-06-10 | Phase 3 | ✅ Completed | Added client‑side role loading and checks |
| AUTH_MIGRATION_REPORT.md | Authentication migration to Supabase | 2026-06-10 | Phase 2J | ✅ Completed | FastAPI auth removed |
| ROLE_USER_MIGRATION_REPORT.md | Migration of role & user admin from FastAPI to Supabase | 2026-06-10 | Phase 3 | ✅ Completed | Role CRUD moved to Supabase; no remaining FastAPI imports |
| FASTAPI_REMOVAL_COMPLETION_REPORT.md | Final cleanup of FastAPI legacy code | 2026-06-10 | Completion | ✅ Completed | All FastAPI files removed, dependencies cleared |
| POST_AUTH_CLEANUP_REPORT.md | Post‑auth cleanup after FastAPI removal | 2026-06-10 | Completion | ✅ Completed | Removed FastAPI refs, placeholders, legacy JWT code |
| PROJECT_CLEANUP_REPORT.md | Production cleanup of temporary and obsolete files | 2026-06-10 | Completion | ✅ Completed | Docs moved, test scripts archived |
| SUPABASE_V2_AUTH_FIX_REPORT.md | Supabase v2 auth migration report | 2026-06-10 | Completion | ✅ Completed | Auth API updated, build passed |
| FINAL_AUTH_COMPLETION_REPORT.md | Final authentication completion report | 2026-06-10 | Completion | ✅ Completed | Auth flow verified, diagnostics removed |
| USERNAME_ONLY_AUTH_IMPLEMENTATION_REPORT.md | Username‑only auth implementation report | 2026-06-10 | Completion | ✅ Completed | Added user_profiles, synthetic email login |
| DATABASE_AUTH_IMPLEMENTATION_REPORT.md | Database‑only auth implementation report | 2026-06-10 | Completion | ✅ Completed | Added users & sessions tables, architecture doc |
| LOGIN_SCHEMA_AUDIT.md | Audit of Supabase schema & auth strategy | 2026-06-10 | Completion | ✅ Completed | Identified lack of user_profiles, recommended email login |
| WORKSHEET_PERFORMANCE_AUDIT.md | Worksheet rendering performance audit (Phase 3A) | 2026-06-10 | Phase 3A | ✅ Completed | Identified bottlenecks, recommendations for virtualization, pagination, memoization |
| FINAL_PROJECT_AUDIT.md | Production cleanup audit | 2026-06-10 | Completion | ✅ Completed | Cleanup steps verified, build passed |

---

## SECTION 16 – TESTING & DIAGNOSTICS HISTORY

| Issue | Root Cause | Resolution | Files Changed |
|-------|------------|------------|----------------|
| Hook Order Error | Misordered middleware initialization | Reordered hooks in `backend/app/main.py` | `backend/app/main.py` |
| Supabase Connection Issue | Missing env vars | Added `.env` entries and loaded in `supabaseClient.ts` | `frontend/src/services/supabaseClient.ts` |
| Role Management Route Issue | Incorrect endpoint path | Updated route definitions | `backend/app/routes/role.py` |
| Auth Migration Issue | FastAPI auth endpoints removed | Refactored to Supabase Auth in frontend | `frontend/src/context/AuthContext.tsx`, `frontend/src/pages/Login.tsx`, `frontend/src/pages/Profile.tsx` |

---

## SECTION 17 – AI CONTINUATION GUIDE

1. **Current Project Status**: FastAPI removal in progress, deployment automation pending.
2. **Completed Phases**: 1A‑1C, 2A‑2B, 2J (audit).
4. **Open Tasks**: CI/CD, performance optimisation for large worksheets, final removal of any leftover FastAPI auth code.
4. **Known Issues**: Legacy tables, env var refs, large data lag.
5. **Reports To Read First**: `AUTH_MIGRATION_REPORT.md`, `SUPABASE_VERIFICATION_REPORT.md`.
6. **Recommended Next Task**: Optimize large worksheet rendering.
7. **Critical Files**: See Section 14.
8. **Development Rules**: Keep `ER_TRACKER_PROJECT_KNOWLEDGE_BASE.md` updated after any change.

---

## SECTION 18 – DOCUMENTATION STANDARDS

* Every completed phase must generate a `PHASE_NAME_REPORT.md`.
* Every audit must generate a `*_AUDIT.md`.
* Every debugging effort must generate a `*_DEBUG_REPORT.md`.
* Every migration must generate a `*_MIGRATION_REPORT.md`.
* Every architecture review must generate a `*_ARCHITECTURE.md`.

---

*Generated on 2026‑06‑10.*

---

*Generated on 2026‑06‑10.*
