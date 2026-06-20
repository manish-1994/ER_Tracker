# Workspace Guide

## Workbook Assignment Flow

### Assignment Creation
**Admin Location**: `/workbooks` → Assign button
**Service**: `assignWorkbook()` in workspaceService.ts:167-212

```
1. Admin clicks "Assign" on workbook row
2. Modal opens (Workbooks.tsx:660-740)
3. Admin selects user from CyberSelect dropdown
4. Admin configures permissions:
   - can_edit: defaults true
   - can_delete: defaults false
   - can_export: defaults true
   - notes_enabled: defaults true
   - sheet_ids: optional (not implemented - assignEntireWorkbook checkbox unused)
5. INSERT into workspace_assignments table
```

**Database Insert** (workspaceService.ts:187-196):
```typescript
const payload: any = {
  user_id: intUserId,
  workbook_id: intWorkbookId,
  can_edit: permissions.can_edit ?? true,
  can_delete: permissions.can_delete ?? false,
  can_export: permissions.can_export ?? true,
  notes_enabled: permissions.notes_enabled ?? true,
};
```

### Assignment Loading
**User Location**: `/workspace`
**Service**: `getAssignedWorkbooks()` in workspaceService.ts:114-136

```
1. User navigates to /workspace
2. Query workspace_assignments WHERE user_id = currentUserId
3. Returns array of workbook_ids
4. Names loaded separately via workbooks table
```

### Actual Behavior vs Expected
- **WORKS**: Workbooks appear on workspace page for assigned users
- **WORKS**: Clicking workbook navigates to workspace workbook view
- **WORKS**: Worksheet access respects assignment (via permission checks)
- **LIMITATION**: Sheet-level assignment not enforced (sheet_ids parameter unused)

## Worksheet Access Flow

### Navigation
**Route**: `/workspace/workbook/{workbookId}` → worksheet click → `/worksheets/{sheetId}`

**Process**:
1. UserWorkspace.tsx:16-30 loads assigned workbook IDs
2. WorkspaceWorkbook.tsx:44-59 loads worksheets for selected workbook
3. Worksheet.tsx:445-467 fetches workspace permissions for the workbook
4. Permissions determine UI capabilities (edit, delete, add column, etc.)

### Permission Enforcement
**Location**: Worksheet.tsx lines 119-131, 445-467

```typescript
// In Worksheet.tsx
const canView = isSuperAdmin || role !== 'Viewer';
const canEdit = isSuperAdmin || canView;
const canDelete = isSuperAdmin || wsCanDelete;
const canManageColumns = isSuperAdmin || role === 'Admin' || wsCanEdit;
```

**Service Call** (workspaceService.ts:338-396):
1. Queries `sheets` table to get `workbook_id`
2. Queries `workspace_assignments` for `can_edit`/`can_delete` flags
3. SuperAdmin bypasses all checks (lines 364-368)

### Shared Data Model
The workspace uses a hybrid data model:

| Component | Source | Writes |
|-----------|--------|--------|
| Workbooks | `workbooks` table | Direct to Supabase |
| Worksheets | `sheets` table | Direct to Supabase |
| Columns | `columns` table | Direct to Supabase |
| Rows | Dynamic `records_<uuid>` tables OR localStorage fallback | Hybrid: Supabase if table exists, localStorage if not |

## Notes System

### Shared (Public) Notes
**Table**: `workspace_notes` (migration line 32-46)
**Columns**: id, user_id, workbook_id, sheet_id, assignment_id, record_id, is_private, title, content, created_at, updated_at

**Behavior**:
- Visible to all users with worksheet access
- Created via "Add Public Note" in record detail panel
- Realtime updates via Supabase channel subscription

**Code** (Worksheet.tsx:791-831):
```typescript
const handleAddNote = async (isPrivate: boolean) => {
  const note = await createRecordNote({
    user_id: String(appUser.id),
    workbook_id: sheet?.workbook_id ? String(sheet.workbook_id) : undefined,
    sheet_id: id,
    record_id: selectedRecord.id,
    is_private: isPrivate,
    content: content
  });
};
```

### Private Notes
**Behavior**:
- Only visible to note author
- `is_private = true` in workspace_notes table
- Query filters by user_id (workspaceService.ts:431-432)

### Permission Model
```
can view notes = notes_enabled flag in workspace_assignments
can edit notes = note author OR SuperAdmin OR Admin
can delete notes = note author OR SuperAdmin OR Admin
```

## Record Editing in Workspace

### Edit Flow
1. User opens record detail (CyberDrawer)
2. Form fields rendered based on column metadata
3. Changes made in form state
4. `updateRow()` called with all field values
5. Supabase UPDATE on dynamic records table
6. localStorage hybrid fields merged and saved

**Evidence**: Worksheet.tsx lines 930-956 show `saveRecordDetail()` function

### Delete Flow
1. User clicks delete in record detail or row action
2. Confirmation modal appears
3. `deleteRow()` called with sheetId and rowId
4. **Soft-delete first**: Sets `deleted_at` and `deleted_by` (lines 644-648 in rowService.ts)
5. Falls back to hard delete if soft-delete fails
6. localStorage fallback for missing tables

### Undo Capability
- Appears after delete with 8-second countdown
- Restores deleted rows via `createRow()` calls
- **Evidence**: Worksheet.tsx lines 55-56 initialize `undoCountdown: 0`, lines 1068-1089 implement undo

## Real-time Collaboration

### Implementation
**Location**: Worksheet.tsx lines 188-217

```typescript
supabase
  .channel(`rows:${id}`)
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: tn 
  }, (payload) => {
    refetchRows();
  })
  .subscribe();
```

### Notes Realtime
**Location**: Worksheet.tsx lines 241-265

```typescript
supabase
  .channel(`notes-collab:${id}:${selectedRecord.id}`)
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'workspace_notes'
  }, (payload) => {
    fetchRecordNotesAndTimeline(selectedRecord.id);
  })
```

### Limitations
- **No conflict resolution**: Last write wins
- **No presence indicators**: Cannot see other users viewing same record
- **No cursor sharing**: No shared editing cursors
- **No merge strategy**: Updates overwrite previous values

## Permission Enforcement

### Route Level
**ProtectedRoute.tsx** lines 18-24:
```typescript
if (requiredPermission) {
  const hasPerm = checkPermission(normalizedRoles, requiredPermission.module, requiredPermission.action);
  if (!hasPerm) {
    return <Navigate to="/unauthorized" ... />;
  }
}
```

### UI Level
**Worksheet.tsx** lines 119-131:
```typescript
const canView = isSuperAdmin || role !== 'Viewer';
const canEdit = isSuperAdmin || canView;
const canDelete = isSuperAdmin || wsCanDelete;
const canManageColumns = isSuperAdmin || role === 'Admin' || wsCanEdit;
```

### Database Level
**RLS Policy** (migration 20260613000000:41-44):
```sql
CREATE POLICY "Users view own assignments" ON public.workspace_assignments
FOR SELECT
USING (user_id::text = auth.uid()::text);
```

**Missing**: RLS policies for workspace_notes and audit_logs (migration line 24 disables RLS)

## Current Limitations

| Feature | Status | Evidence |
|---------|--------|----------|
| Sheet-level assignment | NOT IMPLEMENTED | assignEntireWorkbook checkbox exists but sheet_ids unused in assignWorkbook() |
| RLS on notes | DISABLED | Migration line 24: `DISABLE ROW LEVEL SECURITY` |
| RLS on audit_logs | DISABLED | Migration line 42 |
| Column type changes | METADATA ONLY | Adding column doesn't migrate database schema |
| Conflict resolution | NOT IMPLEMENTED | Last-write-wins behavior |
| Offline support | PARTIAL | localStorage fallback exists but no sync recovery |