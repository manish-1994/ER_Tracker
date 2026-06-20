# Supabase Verification Report

## Overview
This document audits the front‑end implementation of the **ER Tracker** application to confirm that each core feature works **without relying on FastAPI**. For every feature we list:

* **Supabase tables** used
* **Service file** (or client) that accesses those tables
* Any **FastAPI dependency** still present in the front‑end code base

The final section classifies each feature as **READY TO REMOVE**, **NEEDS MIGRATION**, or **BLOCKED** based on the findings.

---

## Feature Audit

### 1. Login
* **Supabase tables**: `users`
* **Service file**: `frontend/src/services/supabaseClient.ts`
* **FastAPI dependencies**: None detected in the front‑end login flow.

### 2. Role Management
* **Supabase tables**: `roles`, `role_permissions`, `user_roles`
* **Service file**: `frontend/src/services/roleService.ts`
* **FastAPI dependencies**: None.

### 3. Workbook Import
* **Supabase tables**: `workbooks`, `sheets`, dynamic `records_<uuid>` tables per worksheet
* **Service file**: `frontend/src/services/workbookService.ts`
* **FastAPI dependencies**: None.

### 4. Workbook List
* **Supabase tables**: `workbooks`
* **Service file**: `frontend/src/services/workbookService.ts`
* **FastAPI dependencies**: None.

### 5. Worksheet View
* **Supabase tables**: `sheets`, `records_<sheet_id>` (dynamic per worksheet)
* **Service file**: `frontend/src/services/worksheetService.ts`
* **FastAPI dependencies**: None.

### 6. Add Row
* **Supabase tables**: Dynamic `records_<sheet_id>`
* **Service file**: `frontend/src/services/rowService.ts`
* **FastAPI dependencies**: None.

### 7. Delete Row
* **Supabase tables**: Dynamic `records_<sheet_id>`
* **Service file**: `frontend/src/services/rowService.ts`
* **FastAPI dependencies**: None.

### 8. Inline Cell Edit
* **Supabase tables**: Dynamic `records_<sheet_id>`
* **Service file**: `frontend/src/services/rowService.ts`
* **FastAPI dependencies**: None.

### 9. Header Rename
* **Supabase tables**: `columns`
* **Service file**: `frontend/src/services/worksheetService.ts`
* **FastAPI dependencies**: None.

### 10. Audit Logs
* **Supabase tables**: `audit_logs`
* **Service file**: `frontend/src/services/auditService.ts`
* **FastAPI dependencies**: None.

---

## Unused Backend Artifacts
The following front‑end artifacts were searched for but **not used** anywhere in the code base:

* `frontend/src/config/api.ts` – defines `API_BASE` from `VITE_API_BASE_URL`
* `frontend/src/services/api.ts` – creates an `axios` instance using `API_BASE_URL`
* The `axios` package itself is listed in `package.json` but no import of `axios` remains after the migration.

All three are safe to remove once the Supabase‑only verification is complete.

---

## Classification
| Feature | Classification |
|---------|----------------|
| Login | READY TO REMOVE |
| Role Management | READY TO REMOVE |
| Workbook Import | READY TO REMOVE |
| Workbook List | READY TO REMOVE |
| Worksheet View | READY TO REMOVE |
| Add Row | READY TO REMOVE |
| Delete Row | READY TO REMOVE |
| Inline Cell Edit | READY TO REMOVE |
| Header Rename | READY TO REMOVE |
| Audit Logs | READY TO REMOVE |

> **Note**: *READY TO REMOVE* means the feature works fully with Supabase and has no remaining FastAPI dependencies. No feature is currently **BLOCKED**.

---

## Next Steps
* The backend can now be removed after a final smoke test.
* Clean up the unused `api.ts` and `api` service files, and prune `axios` from `package.json`.

---

*Report generated on 2026‑06‑10.*
