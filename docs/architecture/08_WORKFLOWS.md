# Workflows

## Login Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant B as Browser
    participant S as Supabase
    
    U->>B: Enter username/password
    B->>S: SELECT * FROM users WHERE username = ? (authHelper.ts:107-111)
    S-->>B: Return user record with hashed_password
    B->>B: bcrypt.compare(password, hashed_password) (authHelper.ts:122)
    B->>S: SELECT role_id FROM user_roles WHERE user_id = ? (authHelper.ts:18-44)
    B->>S: SELECT name FROM roles WHERE id IN (...) (authHelper.ts:18-44)
    B->>B: Store appUser in localStorage
    B-->>U: Redirect to /dashboard
```

## Workbook Upload Workflow

```mermaid
flowchart TD
    A[User selects XLSX/CSV file] --> B[XLSX.read arrayBuffer]
    B --> C[Create workbook record]
    C --> D{For each worksheet}
    D --> E[Create sheet in sheets table]
    E --> F[Create columns in columns table]
    F --> G[CreateRowsBulk to records_* table]
    G --> H[UpdateProgress: 100%]
    H --> I[Show success message]
```

**Code Path** (Workbooks.tsx:83-254):
1. lines 87-90: File validation
2. lines 129-130: `createWorkbook()`
3. lines 159-222: Sheet/column/row creation loop
4. lines 206-209: Progress modal updates

## Workbook Assignment Workflow

```mermaid
sequenceDiagram
    participant SA as SuperAdmin/Admin
    participant W as Workbooks.tsx
    participant WS as workspaceService
    participant DB as Supabase
    
    SA->>W: Click Assign on workbook
    W->>WS: getAssignableUsers()
    WS->>DB: SELECT * FROM users (userService.ts:226-261)
    DB-->>WS: Return users list
    W->>SA: Show assignment modal
    SA->>W: Select user, set permissions
    W->>WS: assignWorkbook()
    WS->>DB: INSERT INTO workspace_assignments
    DB-->>WS: Return assignment record
    WS-->>W: Show success
```

**Evidence**: Workbooks.tsx:304-388, workspaceService.ts:167-212

## Worksheet Access Workflow

```mermaid
flowchart TD
    A[User navigates to /workspace/workbook/{id}] --> B[Fetch worksheets for workbook]
    B --> C{For each worksheet}
    C --> D[Fetch columns]
    C --> E[Fetch rows]
    E --> F{Table exists?}
    F -->|Yes| G[Query records_* table]
    F -->|No| H[localStorage fallback]
    D --> I[Render CyberTable]
    G --> I
    H --> I
    I --> J[Subscribe to realtime]
```

## Create Record Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Worksheet.tsx
    participant RS as rowService
    participant DB as Supabase
    
    U->>W: Click + Add Row Entry
    W->>W: Open CyberModal
    U->>W: Fill form, click Save
    W->>RS: createRow(worksheetId, payload)
    RS->>DB: Query localStorage schema (supabase_table_schemas.json)
    RS->>DB: INSERT INTO records_{worksheetId}
    DB-->>RS: Return new row
    RS-->>W: Return created row
    W->>W: Add audit log entry
    W-->>U: Show success toast
```

## Edit Record Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Worksheet.tsx
    participant RS as rowService
    participant DB as Supabase
    
    U->>W: Click cell or open detail
    U->>W: Modify values
    W->>RS: updateRow(worksheetId, rowId, payload)
    RS->>RS: Split payload into database/hybrid (lines 545-559)
    RS->>DB: UPDATE records_{worksheetId}
    DB-->>RS: Return updated row
    RS-->>W: Return updated row
    W->>W: Add audit log
    W-->>U: Show success toast
```

## Delete Record Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Worksheet.tsx
    participant RS as rowService
    participant DB as Supabase
    
    U->>W: Click Delete, confirm
    W->>RS: deleteRow(worksheetId, rowId)
    RS->>DB: UPDATE records_{worksheetId} SET deleted_at = NOW(), deleted_by = userId
    DB-->>RS: Success or error
    RS->>W: Show undo option for 8s
    U->>W: Click Undo (optional)
    W->>RS: createRow(worksheetId, oldData)
    RS-->>W: Restore row
```

**Code Evidence**: rowService.ts:639-682 (soft delete with fallback), Worksheet.tsx:1068-1089 (undo)

## Export Workflow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Worksheet.tsx
    participant EU as exportUtils
    participant X as xlsx library
    
    U->>W: Click XLSX/CSV button
    W->>EU: exportToExcel/CSV(title, columns, data, filename)
    EU->>X: XLSX.utils.json_to_sheet(formatted)
    X->>X: Generate workbook
    X->>U: Download file via link click
```

## Audit Log Workflow

```mermaid
sequenceDiagram
    participant S as Service
    participant A as auditService
    participant LS as localStorage
    participant DB as Supabase
    
    S->>A: logAudit(payload)
    A->>LS: Save to local_audit_logs (lines 50-57)
    A->>DB: INSERT INTO audit_logs (lines 61-71)
    DB-->>A: Success or fallback
    A-->>S: Return log entry
    
    U->>A: getAllAuditLogs()
    A->>LS: Read local_audit_logs
    A->>DB: SELECT * FROM audit_logs ORDER BY timestamp DESC
    DB-->>A: Return logs
    A-->U: Merge and return sorted
```

## User Management Workflow

```mermaid
flowchart TD
    A[Admin opens /users] --> B[Fetch users + roles]
    B --> C[Display user table]
    C --> D{Action}
    D --> E[Create User]
    D --> F[Edit User]
    D --> G[Reset Password]
    D --> H[Assign Roles]
    D --> I[Delete User]
    
    E --> E1[bcrypt.hash password]
    E1 --> E2[INSERT users]
    E2 --> E3[INSERT user_roles]
    
    F --> F1[UPDATE users username/is_active]
    F1 --> F2[DELETE user_roles]
    F2 --> F3[INSERT user_roles]
    
    G --> G1[bcrypt.hash new password]
    G1 --> G2[UPDATE users hashed_password]
    
    I --> I1[Check: not self?]
    I1 --> I2[Check: not last SuperAdmin?]
    I2 --> I3[DELETE users]
    I3 --> I4[DELETE user_roles cascade]
```

## Workspace Permission Check Flow

```mermaid
sequenceDiagram
    participant W as Worksheet.tsx
    participant WS as workspaceService
    participant DB as Supabase
    participant UA as user_roles
    participant R as roles
    
    W->>WS: getWorksheetPermissions(userId, workbookId)
    WS->>DB: SELECT role_id FROM user_roles WHERE user_id = ?
    DB-->>WS: Return role_ids
    WS->>DB: SELECT name FROM roles WHERE id IN (...)
    DB-->>WS: Return role names
    WS->>WS: Check if SuperAdmin (lines 364-369)
    WS->>DB: SELECT can_edit, can_delete FROM workspace_assignments
    DB-->>WS: Return permissions
    WS-->>W: Return { can_edit, can_delete }
```