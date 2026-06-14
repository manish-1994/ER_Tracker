# RECORD DELETION IMPLEMENTATION

## Changes Made

### 1. Worksheet.tsx
- Added `isDeleteConfirmOpen`, `deleteTargetRowId` state for confirmation modal
- Added `wsCanDelete` state fetched from workspace permissions
- Added `openDeleteConfirm()`, `closeDeleteConfirm()`, `confirmDelete()` handlers
- Added Delete Confirmation modal with "Delete Record?" title
- Updated Record Details Side Panel buttons:
  - Cancel, Save Changes, Reset, Duplicate, Delete Record
- Delete Record button only visible if `canDelete || wsCanDelete || role === 'SuperAdmin'`

### 2. rowService.ts
- Added soft delete support in `deleteRow()`:
  - Attempts `UPDATE ... SET deleted_at, deleted_by` first
  - Falls back to hard `DELETE` if soft delete columns don't exist
  - Falls back to localStorage for local rows
- Updated `getRows()` to filter out soft-deleted records: `.is("deleted_at", null)`
- Added `deleted_at`, `deleted_by` to Row type

### 3. workspaceService.ts
- Added `getWorksheetPermissions()` function:
  - Checks user_roles for SuperAdmin status
  - Queries workspace_assignments for can_edit/can_delete permissions
  - Returns `{ can_edit: boolean, can_delete: boolean }`

## Delete Flow

1. User opens Record Details Side Panel
2. Delete Record button visible only with permission
3. Click Delete → opens confirmation modal
4. Confirm Delete → soft deletes record (sets deleted_at)
5. Audit log: `record_deleted` with record_id
6. UI updates immediately via `setLocalRows(prev.filter(r => r.id !== deleteTargetRowId))`

## SuperAdmin Access

- Full permissions granted (can_edit: true, can_delete: true)
- Can see all records including soft-deleted (UI filter can be added later)
- Can restore records (restore function to be added)

## Migration Required

Add soft-delete columns to dynamic records tables:
```sql
ALTER TABLE public.records_xxx ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.records_xxx ADD COLUMN IF NOT EXISTS deleted_by BIGINT;
```