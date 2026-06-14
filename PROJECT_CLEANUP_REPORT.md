# PROJECT_CLEANUP_REPORT

This report provides a comprehensive summary of the project audit conducted on the **ER Tracker** application. It details unused components, files, deprecated architectures, debugging logs, duplicate logic, and package dependency audits.

---

## Executive Summary

| Metric | Value |
| :--- | :--- |
| **Total Files Scanned** | 175 (Frontend, Backend, Docs, and Root) |
| **Total Components** | 19 (7 custom components, 12 ui components) |
| **Total Services** | 11 (in `frontend/src/services`) |
| **Total Hooks** | 0 (directory is empty) |
| **Total Utilities** | 2 (in `frontend/src/utils`) |
| **Unused Files Found** | 8 (to be deleted) |
| **Diagnostic Scripts to Archive** | 87 (to be moved to `docs/archive/`) |
| **Unused NPM Packages Found** | 7 (`axios` in frontend; 6 packages in root) |
| **Debug Log Statements Found** | 145 occurrences |
| **Expected Size Reduction** | ~188 KB (~12.8 KB deleted, ~175 KB archived) |

---

## Phase 1 & 2 — Unused & Obsolete Files

The following files have been verified as completely unused through dependency graphing and are recommended for immediate action.

### Recommended for Deletion (Safe Delete)
These files have no references in active pages, layouts, or routing, and are safe to remove.
- **Components**:
  - `frontend/src/components/Modal.tsx` (Outdated vanilla modal, replaced by `CyberModal.tsx`)
  - `frontend/src/components/RoleSelect.tsx` (Unused, replaced by inline selectors)
  - `frontend/src/components/UserForm.tsx` (Unused form, user forms are inline in `UserManagement.tsx`)
- **Pages**:
  - `frontend/src/pages/Users.tsx` (Legacy user manager, superseded by `UserManagement.tsx`)
  - `frontend/src/pages/UsersManagement.tsx` (Empty placeholder file)
- **Backend (Obsolete API)**:
  - `backend/main.py` (FastAPI app entry point; bypassed by Supabase-only architecture)
  - `backend/api/users.py` (FastAPI router; superseded by client-side database auth)
- **Supabase Functions**:
  - `supabase/functions/create-user/index.ts` (Empty placeholder; user creation is client-side)

### Recommended for Archival
A total of **87 files** consisting of testing scripts, database schema probes, and development SQL seeds are clogging the root directory and the `docs/` folder. They must be moved to `docs/archive/` (detailed list in `ARCHIVE_LIST.md`).

---

## Phase 3 — Debugging Cleanup Summary

We scanned the active source files for `console.log`, `console.warn`, `console.debug`, and `debugger`. Out of **145 occurrences**:
- **129** are temporary trace logs, workflow diagnostics, or render checkers in active components/services that should be removed in production.
- **16** are essential error handlers (`console.error` inside catch blocks) or setup checks (e.g., in `schemaValidation.ts` and `ingest_workbook.js`) that should be **KEPT**.

Refer to the detailed list in `C:\Users\User\.gemini\antigravity-ide\brain\8cabb3e7-767b-4eca-b8f8-dfe2cd0cb742\scratch\debug_logs_report.md` for line-by-line breakdown.

---

## Phase 4 & 5 — Duplicate & Obsolete Logic

During the audit, we detected several areas of duplicate implementation and legacy fallback code:

### 1. Worksheet-to-Table Resolve Redundancy
* **Issue**:
  - `frontend/src/services/rowService.ts` defines `resolveRecordTable` which queries `sheets` metadata, falls back to a hardcoded map `SHEET_TO_RECORD_TABLE`, and reads/writes localStorage `sheet_table_map_${sheetId}`.
  - `frontend/src/services/workbookService.ts` defines its own `findRecordsTablesForSheets` doing an identical sheets metadata fetch, falling back to a hardcoded list `discoveredRecordsTables`, and reading localStorage.
* **Consolidation**:
  - Refactor `workbookService.ts` to import and call `resolveRecordTable` from `rowService.ts` or consolidate the mapper to `sharedUtils.ts` to eliminate duplicate database calls and double localStorage keys.

### 2. Client-Side Hashing vs Backend REST Router
* **Issue**:
  - The application has two distinct user creation mechanisms: client-side hashing in `userService.ts` (`bcryptjs` hashing in the browser, direct insertion into Supabase `users`), and server-side hashing in `backend/api/users.py` (`argon2` hashing on a FastAPI server).
  - The backend server is not running and the frontend has no HTTP links calling it.
* **Consolidation**:
  - The entire `backend/` directory should be removed. We should rely exclusively on the client-side database auth flow defined in `userService.ts`.

### 3. Duplicate Hybrid Audit Logging
* **Issue**:
  - Deletion flows in `rowService.ts` (records) and `workbookService.ts` (workbooks) duplicate the pattern of sending an audit log entry to Supabase AND saving it locally to `localStorage` under `local_audit_logs`.
* **Consolidation**:
  - Extract this dual-persistence behavior into a single, clean `logAuditEvent` helper function in `auditService.ts` and call it from the delete services.

---

## Phase 7 — NPM Dependency Audit

### 1. Unused Packages (Safe to Uninstall)
These dependencies are declared but never imported:
- **Frontend Project (`frontend/package.json`)**:
  - `axios` (All data fetching is done directly via `@supabase/supabase-js`)
- **Root Project (`package.json`)**:
  - `@headlessui/react`
  - `@heroicons/react`
  - `@tanstack/react-query-devtools`
  - `node-fetch`
  - `ts-node`
  - `ws`

### 2. Phantom Dependencies (Risk of Build Failure)
The frontend imports several external packages that are **not** declared in `frontend/package.json`, but are resolved from the parent directory's `node_modules`:
- `framer-motion`
- `lucide-react`
- `recharts`

If the root dependencies are cleaned up, the frontend build **will fail**. These must be installed in the frontend project.

### Recommended Commands

To clean up unused packages and fix phantom dependency vulnerabilities, run the following:

```bash
# 1. Uninstall unused package from frontend
cd frontend
npm uninstall axios

# 2. Install phantom dependencies in frontend
npm install framer-motion lucide-react recharts

# 3. Uninstall unused packages from root
cd ..
npm uninstall @headlessui/react @heroicons/react @tanstack/react-query-devtools node-fetch ts-node ws
```

---

## Performance & Maintenance Improvements
- **Build Times**: Removing 8 dead files and aligning dependencies will decrease frontend asset-bundling overhead.
- **Clutter Elimination**: Moving 87 development/diagnostic scripts out of the root and documentation folders will allow developers to navigate the codebase easily without confusing helper scripts with core files.
- **Security**: Removing the dead FastAPI backend closes unused files that could introduce vulnerabilities.
