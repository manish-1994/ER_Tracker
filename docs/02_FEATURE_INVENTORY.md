# Feature Inventory

## Authentication Features

### Login/Logout
- **Status**: WORKING
- **Location**: `frontend/src/pages/Login.tsx`, `frontend/src/services/authHelper.ts:105-138`
- **Components**: Login.tsx, Logout.tsx
- **Services**: `supabase.from("users").select()`, `bcrypt.compare()`
- **Evidence**: Lines 105-138 in authHelper.ts show bcrypt validation; App.tsx lines 31-32 show login route without guards

### Session Restoration
- **Status**: WORKING
- **Location**: `frontend/src/context/AuthContext.tsx:23-52`
- **Mechanism**: localStorage "appUser" persistence with role refresh
- **Limitation**: No automatic token refresh; session persists until explicit logout

## Workbook Features

### Workbook List
- **Status**: WORKING
- **Location**: `frontend/src/pages/Workbooks.tsx:73-81`
- **Services**: `getWorkbooks()` in workbookService.ts:21-25
- **Controls**: Search filter, file upload, assign, rename, delete

### Workbook Upload (XLSX/CSV Ingestion)
- **Status**: WORKING
- **Location**: `frontend/src/pages/Workbooks.tsx:83-254`, `frontend/src/services/workbookService.ts:38-47`
- **Process**:
  1. Parse file via xlsx library
  2. Create workbook record
  3. Create worksheets in `sheets` table
  4. Create columns in `columns` table
  5. Bulk insert rows via `createRowsBulk()` into dynamic `records_*` tables
- **Evidence**: Lines 83-254 in Workbooks.tsx show complete upload pipeline

### Workbook Delete
- **Status**: WORKING
- **Location**: `frontend/src/services/workbookService.ts:139-324`
- **Cascade**: Deletes sheets, columns, rows, permissions, audit logs
- **Soft-delete**: Attempts soft-delete on rows via `deleted_at`/`deleted_by` columns

### Workbook Rename
- **Status**: WORKING
- **Location**: `frontend/src/pages/Workbooks.tsx:286-301`
- **Service**: `updateWorkbook()` in workbookService.ts:339-353

## Worksheet Features

### Worksheet List/View
- **Status**: WORKING
- **Location**: `frontend/src/pages/WorkspaceWorkbook.tsx`
- **Service**: `getWorksheets()` in worksheetService.ts:27-38

### Worksheet Rename
- **Status**: WORKING
- **Location**: `frontend/src/pages/Worksheet.tsx:495-524`
- **Service**: `updateWorksheet()` in worksheetService.ts:52-66
- **Permission**: Requires edit permission (line 119-121 in Worksheet.tsx checks canEdit)

### Column Management
- **Status**: WORKING (Partially implemented)
- **Location**: `frontend/src/pages/Worksheet.tsx:560-711`
- **Features**:
  - Create column: `createColumn()` in worksheetService.ts:298-317
  - Edit column display name: `updateColumnDisplayName()` in worksheetService.ts:96-123
  - Hide/show column: `hideColumn()` in worksheetService.ts:126-153
  - Reorder columns: `reorderColumns()` in worksheetService.ts:156-184
  - Delete column: `deleteColumn()` in worksheetService.ts:319-343
- **Missing**: Database schema migration for column changes

### Row Management
- **Status**: WORKING
- **Location**: `frontend/src/pages/Worksheet.tsx:359-443`, `frontend/src/services/rowService.ts`
- **Features**:
  - Create row: `createRow()` lines 359-443
  - Edit row: `updateRow()` lines 536-637
  - Delete row: `deleteRow()` lines 639-682 (soft-delete with undo)
  - Undo delete: Lines 1068-1089 (8-second countdown, lines 55-56)
- **Hybrid Storage**: Falls back to localStorage for missing tables (lines 212-273 in rowService.ts)

### Smart Views
- **Status**: WORKING
- **Location**: `frontend/src/pages/Worksheet.tsx:1129-1155`
- **Options**: All, My Records, Pending, Completed, High Priority, Recently Updated
- **Evidence**: Filtering logic implemented but relies on column names like "status", "priority", "recruiter"

### Realtime Updates
- **Status**: WORKING
- **Location**: `frontend/src/pages/Worksheet.tsx:188-217`
- **Method**: Supabase channel subscription on `rows:{id}` and `workspace_notes`
- **Behavior**: Auto-refreshes data on changes

## Export Features

### Excel Export
- **Status**: WORKING
- **Location**: `frontend/src/utils/exportUtils.ts:11-30`
- **Function**: `exportToExcel()` uses xlsx library to generate .xlsx files

### CSV Export
- **Status**: WORKING
- **Location**: `frontend/src/utils/exportUtils.ts:35-62`
- **Function**: `exportToCSV()` uses xlsx library for CSV generation

### PDF Export
- **Status**: WORKING (Limited)
- **Location**: `frontend/src/utils/exportUtils.ts:67-69`
- **Method**: `window.print()` browser print dialog

## User Management Features

### User CRUD
- **Status**: WORKING
- **Location**: `frontend/src/pages/UserManagement.tsx`
- **Services**: `getUsers()`, `createUser()`, `updateUser()`, `deleteUser()` in userService.ts
- **Features**:
  - Create user with password hashing (bcrypt, lines 136-211)
  - Edit username and active status
  - Reset password
  - Deactivate/reactivate users
  - Delete users
- **Safety**: Prevents deletion of last active SuperAdmin (lines 240-254)

### Role Assignment
- **Status**: WORKING
- **Location**: `frontend/src/pages/UserManagement.tsx:340-362`
- **Service**: `assignUserRoles()` in userService.ts:340-360

## Role Management Features

### Role CRUD
- **Status**: WORKING
- **Location**: `frontend/src/pages/RoleManagement.tsx:109-222`
- **Services**: `createRoleDefinition()`, `updateRoleDefinition()`, `deleteRoleDefinition()` in roleService.ts

### Permission Matrix Editor
- **Status**: WORKING
- **Location**: `frontend/src/pages/RoleManagement.tsx:255-325`
- **Modules**: Dashboards, Workbooks, Worksheets, Reports, Users, Roles, Settings
- **Actions**: view, create, edit, delete
- **Storage**: localStorage "role_permission_matrices"

### Role Holders View
- **Status**: WORKING
- **Location**: `frontend/src/pages/RoleManagement.tsx:224-231`
- **Shows**: Users assigned to a specific role

## Workspace Features

### Assigned Workbooks View
- **Status**: WORKING
- **Location**: `frontend/src/pages/UserWorkspace.tsx:16-30`
- **Service**: `getAssignedWorkbooks()` in workspaceService.ts:114-136

### Workbook Assignment
- **Status**: WORKING
- **Location**: `frontend/src/pages/Workbooks.tsx:304-388`
- **Service**: `assignWorkbook()` in workspaceService.ts:167-212
- **Permissions**: can_edit, can_delete, can_export, notes_enabled checkboxes

### Record Notes (Shared/Private)
- **Status**: WORKING
- **Location**: `frontend/src/pages/Worksheet.tsx:745-877`
- **Features**:
  - Add public/private notes to records
  - Edit own notes (or Admin/SuperAdmin)
  - Delete notes
  - Realtime updates
- **Table**: `workspace_notes` with `is_private` flag

### Worksheet Permissions Check
- **Status**: WORKING
- **Location**: `frontend/src/pages/Worksheet.tsx:445-467`
- **Service**: `getWorksheetPermissions()` in workspaceService.ts:338-396
- **Logic**: SuperAdmin = full access; otherwise checks `workspace_assignments.can_* columns`

## Dashboard Features

### Default Dashboard
- **Status**: WORKING
- **Location**: `frontend/src/pages/Dashboard.tsx`
- **Metrics**: Workbooks count, worksheets count, users count, recent uploads
- **Charts**: Line chart for upload trends

### Custom Widget Dashboard
- **Status**: PARTIALLY IMPLEMENTED
- **Location**: `frontend/src/pages/Dashboard.tsx:60-164`
- **Widgets**: KPI, bar, line, area, pie, donut, table
- **Missing**: Widget builder UI; widgets stored in localStorage "dashboard_assignments" only

## Audit Features

### Audit Trail
- **Status**: WORKING
- **Location**: `frontend/src/pages/Worksheet.tsx:713-731`, `frontend/src/pages/AuditHistory.tsx`
- **Services**: `logAudit()`, `getAuditLogs()`, `getAllAuditLogs()` in auditService.ts
- **Storage**: Hybrid - Supabase `audit_logs` table + localStorage "local_audit_logs"

### Record Timeline
- **Status**: WORKING
- **Location**: `frontend/src/pages/Worksheet.tsx:745-877`
- **Service**: `getRecordAuditLogs()` in auditService.ts:139-150

## Storage Management Features

### Storage Metrics
- **Status**: WORKING
- **Location**: `frontend/src/pages/StorageManagement.tsx:73-98`
- **Services**: `getDatabaseUsage()`, `getStorageUsage()`, `getDatabaseHealth()` in storageService.ts

### Cleanup Operations
- **Status**: WORKING
- **Location**: `frontend/src/pages/StorageManagement.tsx:142-363`
- **Actions**: Delete logs, temp files, orphaned records, empty/test workbooks, full DB reset
- **Guard**: Requires typing "SYSTEM OVERRIDE RESYNC" phrase

## Settings Features

### HUD Configuration
- **Status**: WORKING
- **Location**: `frontend/src/pages/Settings.tsx`
- **Options**: Accent color, sound effects, refresh interval, telemetry mode, dev console

## Known Limitations

| Feature | Limitation | Evidence |
|---------|------------|----------|
| RLS | Disabled on workspace_notes and audit_logs tables | Migration 20260614000000 line 24: `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` |
| Realtime | Requires Supabase connection; falls back silently | Worksheet.tsx line 218: refetchRows on channel changes |
| Export | PDF uses browser print; no server-side generation | exportUtils.ts:67-69 |
| Widget Builder | No UI for creating custom widgets | Dashboard.tsx relies on localStorage assignments only |
| Column Types | Dynamic table schema changes not reflected in DB | Column changes stored in metadata only |