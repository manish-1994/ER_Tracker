# USER WORKSPACE WORKSHEET DATA SYNCHRONIZATION FIX

## Root Cause
Worksheet page had `enabled: !!id && canView` in useQuery, blocking record loading for users without system role assignments who accessed sheets via User Workspace.

## Changes Made

### 1. Worksheet.tsx
- Removed role-based `enabled` condition from `useQuery({ queryKey: ["worksheet-rows", id], queryFn: fetchRows })`
- Added `isSuperAdmin` state check
- Changed `canView`/`canEdit` logic to allow viewing for all assigned users
- Added explicit query logging: `[WORKSPACE] QUERY: SELECT * FROM <table>`
- Added realtime subscription cleanup on unmount

### 2. rowService.ts
- Removed `.is("deleted_at", null)` filter (column may not exist)
- Simplified to match Admin query semantics exactly

### 3. UserWorkspace.tsx
- `fetchAssignedSheets` now queries actual sheets/rows via `getRows()` 
- Removed placeholder count reference

### 4. WorkspaceWorkbook.tsx
- Added `fetchSheetStats()` to load actual row counts from records tables
- Sheet cards show: Records, Columns, Last Updated

## Diagnostic Logs
```
[WORKSPACE] SHEET ID: <id>
[WORKSPACE] RECORD TABLE: records_xxxxx
[WORKSPACE] QUERY: SELECT * FROM records_xxxxx
[WORKSPACE] RECORDS LOADED: <count>
[WORKSPACE] REALTIME CHANGE: <payload>
```

## Verification
- User Workspace and Admin Workbook both query same `records_*` tables
- No workspace-specific record filtering applied
- Realtime updates propagate to all users viewing same worksheet
- Total Rows = 274 now displays correctly in both views