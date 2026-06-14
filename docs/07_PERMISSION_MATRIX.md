# Permission Matrix

## Role Definitions

Based on `roleService.ts:117-163`:

| Role | Description |
|------|-------------|
| SuperAdmin | System administrator with full access |
| Admin | Administrative user with most privileges |
| Manager | Operational management with create/edit but no role management |
| Analyst | Read-focused access |
| Viewer | Read-only access |

## Permission Matrix

| Feature | SuperAdmin | Admin | Manager | Analyst | Viewer |
|---------|------------|-------|---------|---------|--------|
| **Dashboards** |
| View | ✓ ALLOWED | ✓ ALLOWED | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED |
| Create | ✓ ALLOWED | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED |
| Edit | ✓ ALLOWED | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED |
| Delete | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| **Workbooks** |
| View | ✓ ALLOWED | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED |
| Create | ✓ ALLOWED | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED |
| Edit | ✓ ALLOWED | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED |
| Delete | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| **Worksheets** |
| View | ✓ ALLOWED | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED |
| Create | ✓ ALLOWED | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED |
| Edit | ✓ ALLOWED | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED |
| Delete | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| **Reports** |
| View | ✓ ALLOWED | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED |
| Create | ✓ ALLOWED | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED |
| Edit | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| Delete | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| **Users** |
| View | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| Create | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| Edit | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| Delete | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| **Roles** |
| View | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| Create | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| Edit | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| Delete | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| **Settings** |
| View | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| Create | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| Edit | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED |
| Delete | ✓ ALLOWED | ✓ ALLOWED | ✗ DENIED | ✗ DENIED | ✗ DENIED |

## Workspace-Specific Permissions

These permissions are enforced at the data level via `workspace_assignments`:

| Permission | Source | Enforcement |
|------------|--------|-------------|
| can_edit | workspace_assignments.can_edit | Worksheet.tsx:119-131, 445-467; workspaceService.ts:338-396 |
| can_delete | workspace_assignments.can_delete | Worksheet.tsx:130; workspaceService.ts:338-396 |
| can_export | workspace_assignments.can_export | Worksheet.tsx:export buttons; workspaceService.ts |
| notes_enabled | workspace_assignments.notes_enabled | Worksheet.tsx: notes UI, notes_enabled check in record detail |

**Default Values** (Workbooks.tsx:62-66):
- can_edit: true
- can_delete: false
- can_export: true
- notes_enabled: true

## Enforcement Mechanisms

### Route-Level
**ProtectedRoute.tsx** lines 18-24:
```typescript
if (requiredPermission) {
  const hasPerm = checkPermission(normalizedRoles, requiredPermission.module, requiredPermission.action);
  if (!hasPerm) {
    return <Navigate to="/unauthorized" ... />;
  }
}
```

### Role-Specific Routes
**App.tsx** lines 111-127:
```typescript
<Route path="audit-history" element={
  <ProtectedRoute allowedRoles={["SuperAdmin"]}>
    <AuditHistory />
  </ProtectedRoute>
} />
<Route path="storage-management" element={
  <ProtectedRoute allowedRoles={["SuperAdmin"]}>
    <StorageManagement />
  </ProtectedRoute>
} />
```

### Database-Level (RLS)
**workspace_assignments** (migration 20260613000000:41-44):
```sql
CREATE POLICY "Users view own assignments" ON public.workspace_assignments
FOR SELECT
USING (user_id::text = auth.uid()::text);
```

**Missing RLS** (migration 20260614000000:24, 42):
```sql
ALTER TABLE public.workspace_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
```

## Permission Check Flow

```mermaid
flowchart TD
    A[User Login] --> B[Load Roles]
    B --> C{Check Permission}
    C --> D[ProtectedRoute]
    D --> E{Has Required Permission?}
    E -->|No| F[/unauthorized]
    E -->|Yes| G[Render Component]
    
    H[Worksheet Access] --> I[getWorksheetPermissions]
    I --> J{SuperAdmin?}
    J -->|Yes| K[Full Access]
    J -->|No| L[Check workspace_assignments]
    L --> M[can_edit/can_delete/can_export]
```

## Discrepancies Found

| Area | Issue | Evidence |
|------|-------|----------|
| Reports | Analyst has "Reports:view: false" in matrix but Analyst role typically needs reports | roleService.ts:145-149 |
| Users | No "Users:delete" enforcement visible in UI code beyond route guard | UserManagement.tsx:233-290 has client-side guards |
| Workspace Notes | RLS disabled - all users can read/write all notes | Migration line 24 |
| Audit Logs | RLS disabled - all users can read/write audit trails | Migration line 42 |