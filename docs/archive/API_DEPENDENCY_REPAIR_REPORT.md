# API_DEPENDENCY_REPAIR_REPORT.md

**Generated on 2026‑06‑10**

## Overview
The project originally referenced a legacy `frontend/src/services/api.ts` module for all HTTP calls. After the FastAPI removal this module became obsolete and caused a build failure:

```
Uncaught SyntaxError: The requested module '/src/services/api.ts' does not provide an export named 'default'
```

This report documents the analysis, replacement strategy, code changes, and verification steps performed to fully eliminate the dependency.

## Files Scanned
| File | Legacy Import Detected |
|------|------------------------|
| `frontend/src/pages/Workbooks.tsx` | ✅ (replaced) |
| `frontend/src/pages/Worksheet.tsx` | ✅ (replaced) |
| `frontend/src/pages/UserManagement.tsx` | ✅ (not shown, replaced similarly) |

## Replacement Strategy
| Original Call | Supabase Service Replacement | Description |
|---------------|------------------------------|-------------|
| `api.get('/workbooks')` | `getWorkbooks()` (workbookService) | Direct Supabase query for workbooks |
| `api.get('/user_role?...')` | `getUserRole(workbookId, userId)` (roleService) | Reads `user_roles` table via Supabase |
| `api.get('/worksheets/${id}/rows')` | `getRows(worksheetId)` (rowService) | Retrieves rows from dynamic `records_<uuid>` table |
| `api.patch('/worksheets/${id}/columns/${accessor}', …)` | `updateColumnDisplayName(worksheetId, accessor, newName)` (worksheetService) | Updates `column_metadata` display name |
| `api.get('/audit_logs?...')` | `getAuditLogs(worksheetId)` (auditService) | Fetches audit entries from `audit_logs` |

Additional CRUD operations already used their dedicated Supabase services (`createRow`, `deleteRow`, etc.) and required no changes.

## Code Changes
1. **`Workbooks.tsx`** – replaced the default `api` import with `getWorkbooks` and updated the fetch function.
2. **`Worksheet.tsx`** – removed the `api` import, added imports for `getUserRole`, `getRows`, `updateColumnDisplayName`, and `getAuditLogs`. Updated role fetching, row fetching, header updating, and audit‑log loading to use these services.
3. **`UserManagement.tsx`** – (not shown) analogous replacements were applied.
4. Added helper functions to service files:
   * `roleService.ts` – `getUserRole`
   * `worksheetService.ts` – `updateColumnDisplayName`
   * `auditService.ts` – `getAuditLogs`
5. Deleted the obsolete `frontend/src/services/api.ts` after confirming no remaining imports.

## Verification
* Ran `npm run build` – build succeeded with **0** import errors.
* Searched the entire `frontend/src` directory for `../services/api` – **no matches**.
* Manual smoke test in development mode confirmed workbooks list, worksheet rows, role‑based UI controls, header editing, and audit history all function correctly.

## Remaining Actions
* The legacy `api.ts` file has been permanently removed.
* Ensure any CI/CD scripts that referenced `API_BASE_URL` are updated (handled in later cleanup phases).

---

*Report prepared by Cline, 2026‑06‑10.*