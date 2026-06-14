# Workbook Engine Fix Report

This document reports on the structural corrections made to the workbook engine to eliminate HTTP 400 and 404 errors during sheet loading.

## Implemented Fixes

### 1. Swapped `worksheet_id` for `sheet_id`
All references to the columns table queries have been audited to query columns using the correct database key: `sheet_id`. 
- Modified `frontend/src/services/worksheetService.ts` to execute PostgREST `.eq("sheet_id", worksheetId)` instead of `worksheet_id`.

### 2. Dynamic Record Table Resolver (`resolveRecordTable`)
Replaced the hardcoded static dictionary in `rowService.ts` with a dynamic, schema-probing mapping engine:
- Probes the `columns` table to fetch column definitions for a given `sheetId`.
- Normalizes and sanitizes column headers to lowercase alphanumeric keys (e.g. `EMPLOYEE NAME` -> `employee_name`).
- Probes candidates from the live tables list dynamically using error response inspection (`Perhaps you meant the table...`) if a match is not found in the baseline set.
- Probes tables in parallel via `Promise.all()` to check if the first 3 columns exist in candidate tables.
- Caches the resolved table in the browser's `localStorage` to avoid duplicate queries.
- Dynamically routes all row queries (`getRows`, `getRowsPaginated`, `createRow`, `updateRow`, `deleteRow`) through `await resolveRecordTable(sheetId)`.

### 3. Eliminated Invalid Role References
- Removed all legacy references to workbook roles in the user profiles query and `user_roles` queries. The `user_roles` query now maps solely to the live database schema (which links `user_id` to `role_id` and has no `workbook_id` fields).
