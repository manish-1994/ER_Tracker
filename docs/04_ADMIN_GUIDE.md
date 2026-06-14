# Admin Guide

## User Management

**Location**: `/users`
**Route Guard**: `ProtectedRoute` with `requiredPermission={{ module: "Users", action: "view" }}`
**Accessible By**: SuperAdmin, Admin (based on DEFAULT_MATRIX in roleService.ts:127-134)

### Creating Users
1. Click "+ Provision Operator" button
2. Enter:
   - Username (required, unique)
   - Password (required, min 6 characters)
   - Confirm Password (must match)
   - Role assignments (checkboxes)
3. Click "Initialize Clearance"

**Backend**: `createUser()` in userService.ts:136-211
- Hashes password with bcrypt (line 150)
- Inserts into `users` table
- Assigns roles via `user_roles` table

### Editing Users
1. Click "Edit" button on any user row
2. Modify:
   - Username
   - Active status (checkbox)
3. Click "Write Updates"

**Backend**: `updateUser()` in userService.ts:303-338
- Updates `users` table
- Can update role_ids

### Assigning Roles
1. Click "Roles" button on any user row
2. Check/uncheck roles in the modal
3. Click "Save Authority"

**Backend**: `updateUser()` with `role_ids` parameter
- Deletes existing `user_roles` entries (line 321)
- Inserts new `user_roles` entries (lines 325-330)

### Resetting Passwords
1. Click "Pass" button on any user row
2. Enter:
   - New Password (min 6 characters)
   - Confirm Password
3. Click "Rewrite Passkey"

**Backend**: `resetUserPassword()` in userService.ts:362-376
- Hashes password with bcrypt
- Updates `hashed_password` column

### Deactivating/Activating Users
1. Click "Lock" or "Unlock" button on any user row
2. Toggle suspends/restores account

**Safety Guards**:
- Cannot deactivate own account
- Cannot delete last active SuperAdmin
- Confirmed via dialog if attempting dangerous action

### Deleting Users
1. Click "Del" button on any user row
2. Confirm in dialog
3. User permanently deleted

**Cascade**:
- Deletes from `users` table
- Deletes associated `user_roles` entries

## Role Management

**Location**: `/roles`
**Route Guard**: `ProtectedRoute` with `requiredPermission={{ module: "Roles", action: "view" }}`
**Accessible By**: SuperAdmin, Admin (based on DEFAULT_MATRIX)

### Creating Roles
1. Click "+ Create Clearance" button
2. Enter:
   - Clearance Identifier (role name)
   - Classification Guidelines (description)
3. Configure permission matrix (Module x Actions grid)
4. Click "Initialize Clearance"

**Matrix Editor** (RoleManagement.tsx:255-325):
- Modules: Dashboards, Workbooks, Worksheets, Reports, Users, Roles, Settings
- Actions: view, create, edit, delete
- "Allow All" and "Clear All" quick buttons

### Editing Roles
1. Click "Edit" button on any role card
2. Modify name, description, or matrix
3. Click "Write Updates"

### Cloning Roles
1. Click "Clone" button on any role card
2. Creates copy with "_Copy" suffix
3. Opens create modal pre-filled

### Viewing Role Holders
1. Click "Holders" button on any role card
2. Shows table of users with that role
3. Columns: Avatar, Username, Status

### Deleting Roles
1. Click "Delete" button on any role card
2. **Requirement**: No active users assigned to role
3. Confirm deletion

## Workbook Assignment

**Location**: `/workbooks` → Assign button on any workbook row
**Route Guard**: None on Workbooks page (uses inline permission checks)

### Assigning Workbooks
1. Click "Assign" button on workbook row
2. Select user from dropdown
3. Set permissions:
   - **Assign Entire Workbook**: Grants access to all sheets
   - **Can Edit**: User can modify records
   - **Can Delete**: User can delete records
   - **Can Export**: User can export to Excel/CSV
   - **Notes Enabled**: User can add/view notes
4. Click "Assign Workbook"

**Backend Process** (workspaceService.ts:167-212):
```sql
INSERT INTO workspace_assignments (
  user_id, workbook_id, can_edit, can_delete, 
  can_export, notes_enabled, assigned_by
)
```

### Permission Enforcement
- **Worksheet level**: `getWorksheetPermissions()` queries `workspace_assignments`
- **Row operations**: UI checks `canEdit`, `canDelete` flags before enabling controls
- **RLS**: Policy on `workspace_assignments` restricts SELECT to own records (migration line 41-44)

## Storage Management

**Location**: `/storage-management`
**Route Guard**: `ProtectedRoute` with `allowedRoles={["SuperAdmin"]}`
**Accessible By**: SuperAdmin only

### Monitoring Metrics
- **Database Used**: Size and percentage of 500MB limit
- **Storage Used**: Size and percentage of 5GB limit
- **Remaining Capacity**: Available storage space
- **Usage Percentage**: Overall database utilization

### Module Storage Breakdown
- Tables showing size and record count per module
- Modules: workbooks, sheets, columns, records tables

### Cleanup Operations
**Warning**: All cleanup operations require typing "SYSTEM OVERRIDE RESYNC"

| Action | Effect |
|--------|--------|
| Delete Audit Logs | Clears all audit_logs and local_audit_logs |
| Delete Temp Files | Removes localStorage cached rows |
| Clean Orphaned Records | Removes rows without parent sheets |
| Delete Empty Workbooks | Removes workbooks with no sheets |
| Delete Test Data | Removes workbooks/sheets matching test patterns |
| Delete All Workbooks | Nuclear option: removes all workbook data |
| Reset Dev Database | Full system reset (preserves current user) |

## Audit History

**Location**: `/audit-history`
**Route Guard**: `ProtectedRoute` with `allowedRoles={["SuperAdmin"]}`
**Accessible By**: SuperAdmin only

### Viewing Audit Logs
- Shows all operations in reverse chronological order
- Columns: Timestamp, Operator ID, Action, Details
- Action types: login, upload, delete, create, role_assignment, etc.

### Filtering
- **Search**: Filters by user_id, action, or payload content
- **Action Filter**: Dropdown for action categories (logins, uploads, deletions, etc.)

### Worksheet-Level Audit
- In Worksheet view, click "Audit Trail Logs" button
- Shows actions for current worksheet only
- Includes: cell_updated, row_added, row_deleted, column_created, etc.

## Troubleshooting

### User Cannot Login
1. Verify username exists in `users` table
2. Check password hash using `verifyPasswordHash()` in userService.ts
3. Ensure `is_active = true` in users table

### User Cannot See Assigned Workbook
1. Verify record exists in `workspace_assignments` table
2. Check `user_id` matches user's internal ID
3. Verify RLS policies are in place

### Export Fails
1. Check browser console for errors
2. Verify worksheet has data
3. Confirm xlsx library is loaded (package.json line 20)

### Notes Not Saving
1. Check `workspace_notes` table exists
2. Verify RLS on notes table (may be disabled per migration line 24)
3. Check console for insert errors

### Columns Not Visible After Creation
1. Refresh the worksheet
2. Verify column exists in `columns` table for sheet_id
3. Check `is_hidden` flag in columns table

### Performance Issues
1. Check Storage Management page for high usage
2. Run "Clean Orphaned Records" cleanup
3. Clear browser localStorage cache
4. Consider "Delete All Workbooks" for dev resets