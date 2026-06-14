# Workbook Platform Architecture

## Vision Statement
Transform workbook uploads into editable datasets that power dashboards, analytics, and reports.

## Current Architecture

### File: `docs/SUPABASE_SCHEMA.sql`

| Table | Primary Purpose | Key Columns |
|-------|----------------|-----------|
| `workbooks` | Root container for spreadsheet datasets | `id` (uuid), `name`, `owner_id` (auth.users), `created_at`, `deleted_at` |
| `worksheets` | Individual sheets within a workbook | `id`, `workbook_id`, `title`, `position` |
| `column_metadata` | Schema definition for worksheet columns | `id`, `worksheet_id`, `name`, `display_name`, `data_type`, `order` |
| `worksheet_rows` | Row data stored as JSONB | `id`, `worksheet_id`, `data` (jsonb) |
| `user_roles` | RBAC: map users to workbooks with roles | `id`, `user_id` (auth.users), `workbook_id`, `role` (owner/editor/viewer) |
| `audit_logs` | Change tracking | `id`, `user_id`, `action`, `table_name`, `record_id`, `payload` |

### File: `docs/SUPABASE_RLS.sql` (Policy Summary)

| Table | Operations Allowed | Policy Condition |
|-------|-------------------|-----------------|
| `workbooks` | CRUD | Owner can all; editors/viewers read-only |
| `worksheets` | CRUD | Via workbook role (owner/editor) |
| `column_metadata` | CRUD | Via workbook owner only |
| `worksheet_rows` | CRUD | Via workbook role (owner/editor) |
| `user_roles` | CRUD | Workbook owner only |
| `audit_logs` | INSERT | Self; SELECT via workbook access |

### Service Layer (`frontend/src/services/`)

| Service | Functions | Capabilities |
|---------|-----------|--------------|
| `workbookService.ts` | `getWorkbooks()`, `createWorkbook()` | List and create workbooks |
| `worksheetService.ts` | `getWorksheets()`, `createWorksheet()` | List and create worksheets; rename columns |
| `rowService.ts` | `getRows()`, `createRow()`, `updateRow()`, `deleteRow()` | Full CRUD on row data |
| `auditService.ts` | `logAudit()`, `getAuditLogs()` | Audit trail for changes |

### UI Layer (`frontend/src/pages/`)

| Page | Capabilities |
|------|--------------|
| `Workbooks.tsx` | Upload .xlsx/.xls, list workbooks, delete workbook |
| `Worksheet.tsx` | View worksheets, edit cells inline, add rows, rename columns, audit trail |
| `WorkbookDetail.tsx` | Placeholder stub |

## Required Capabilities Mapping

| Capability | Status | Implementation Location |
|------------|--------|------------------------|
| Upload Workbook | ✓ Implemented | `Workbooks.tsx:handleFileUpload()` |
| View Worksheets | ✓ Implemented | `Worksheet.tsx` |
| Editable Table Grid | ✓ Implemented | `Worksheet.tsx` cell editing |
| Rename Workbook | ✗ Missing | No service/UI |
| Rename Worksheet | ✗ Missing | No service/UI |
| Rename Columns | ✓ Implemented | `worksheetService.ts:updateColumnDisplayName()` |
| Hide Columns | ✗ Missing | No UI toggle |
| Reorder Columns | ✗ Missing | No UI drag-drop |
| Edit Cell Values | ✓ Implemented | `rowService.ts:updateRow()` |
| Search Rows | ✗ Missing | No filter logic |
| Filter Rows | ✗ Missing | No filter logic |
| Pagination | ✗ Missing | No pagination controls |
| Workbook Metadata | ✗ Missing | No detail view |

## Data Flow for Workbook Upload

```
1. User selects .xlsx/.xls file
2. XLSX library parses workbook → SheetNames, Sheets
3. For each sheet:
   a. createWorksheet(workbookId, sheetName) → worksheet record
   b. Parse header row → column_metadata records (data_type: "text")
   c. Parse data rows → worksheet_rows records (data as JSONB)
4. On success: refetch workbook list
```

## Row Storage Model

Rows are stored as JSONB in `worksheet_rows.data`:
- Dynamic schema - no fixed columns
- Column definitions in `column_metadata`
- Cell values accessed via `row.data[columnName]`