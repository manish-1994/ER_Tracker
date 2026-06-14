# WORKBOOK DATAFLOW DEBUG REPORT

## Objective
Diagnose and resolve the data ingestion and dataflow issue where sheet lists and names would load in the UI, but the worksheet data viewer displayed `0 rows` and `NO RECORDS AVAILABLE FOR THIS SHEET`.

## Root Cause Analysis
The workbook data is stored using a structured mapping system in the database:
1. **Workbooks** have **Sheets** (`sheets` table).
2. Each worksheet is mapped to a concrete physical records table (e.g., `records_82788dc9238b480b8b4040caef236409`) where its raw rows are stored.
3. To find the correct table dynamically, `resolveRecordTable` probes candidate tables by attempting to select the worksheet's columns.
4. **The Bug**: The probing logic was previously checking only a limited subset of columns or used lax check criteria. When the probe failed, it fell back to a default table name pattern `records_<sheetId>` (e.g., `records_12`), which did not exist in the database schema. This resulted in `42P01` (relation does not exist) or `404` errors from Supabase, leading to the empty state in the viewer.

## Solution Implemented

### 1. Robust Columns Probing Fix
We updated the probing query in the frontend data service [rowService.ts](file:///d:/ER%20tracker%20Dashboard/frontend/src/services/rowService.ts) and the backend script [ingest_workbook.js](file:///d:/ER%20tracker%20Dashboard/frontend/ingest_workbook.js) to:
- Sanitize and clean up all columns metadata.
- Select all sheet columns from candidate tables.
- Enforce strict success validation check: `status === 200 && !error`.

### 2. Ingestion Execution & Verification
We executed the ingestion script to upload the Excel workbook (`ER - Weekly Update Sheet.xlsx`), mapping the sheets and rows into the resolved physical tables.
- **Workbook Ingested**: `ER - Weekly Update Sheet.xlsx` (Workbook ID: 12)
- **Resolved Mapping**: The script successfully matched columns with the database schema, resolving tables like `records_f054686c1cc947eb820ad9390ab36513` for sheets.
- **Data Insertion**: Rows were parsed and inserted successfully, confirming positive row counts and zero failures.

### 3. Frontend Logging & Traceability
Added console logs in `Worksheet.tsx` tracking:
- Target worksheet selection and columns loading.
- Table resolution workflow (`resolveRecordTable` execution).
- Selected table name queried.
- Exact rows response length and raw data.
- Handling of caching and fallbacks gracefully in case of connection limits.
