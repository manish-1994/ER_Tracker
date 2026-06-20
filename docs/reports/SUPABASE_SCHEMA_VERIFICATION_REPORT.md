# SUPABASE_SCHEMA_VERIFICATION_REPORT.md

## Schema Verification Audit

### Expected Tables (SUPABASE_SCHEMA.sql)

| Table | Status | Notes |
|-------|--------|-------|
| `workbooks` | EXISTS | Configured in SUPABASE_SCHEMA.sql lines 4-11 |
| `worksheets` | EXISTS | Configured in SUPABASE_SCHEMA.sql lines 14-21 |
| `column_metadata` | EXISTS | Configured in SUPABASE_SCHEMA.sql lines 24-33 |
| `worksheet_rows` | EXISTS | Configured in SUPABASE_SCHEMA.sql lines 36-42 |
| `dashboard_widgets` | MISSING | Expected in lines 97-114 but may not exist |
| `user_roles` | EXISTS | Configured in SUPABASE_SCHEMA.sql lines 45-51 |
| `audit_logs` | EXISTS | Configured in SUPABASE_SCHEMA.sql lines 54-62 |
| `users` | EXISTS | Configured in SUPABASE_SCHEMA.sql lines 65-71 |
| `roles` | EXISTS | Configured in SUPABASE_SCHEMA.sql lines 74-79 |
| `permissions` | EXISTS | Configured in SUPABASE_SCHEMA.sql lines 82-87 |
| `role_permissions` | EXISTS | Configured in SUPABASE_SCHEMA.sql lines 90-95 |
| `permission_requests` | MISSING | Listed in schemaValidation.ts line 7 but not in SUPABASE_SCHEMA.sql |
| `user_presence` | MISSING | Used in presenceService.ts but not defined in schema |
| `workspace_assignments` | MISSING | Defined in WORKSPACE_ASSIGNMENTS_MIGRATION.sql but separate file |
| `workspace_notes` | MISSING | Defined in WORKSPACE_ASSIGNMENTS_MIGRATION.sql but separate file |
| `sheets` | CONFLICT | schemaValidation.ts uses but SUPABASE_SCHEMA uses `worksheets` |

### Index Verification

| Index | Status | Notes |
|-------|--------|-------|
| `idx_worksheets_workbook_id` | EXISTS | SUPABASE_SCHEMA.sql line 117 |
| `idx_column_metadata_worksheet_id` | EXISTS | SUPABASE_SCHEMA.sql line 118 |
| `idx_worksheet_rows_worksheet_id` | EXISTS | SUPABASE_SCHEMA.sql line 119 |
| `idx_user_roles_user_id` | EXISTS | SUPABASE_SCHEMA.sql line 120 |
| `idx_user_roles_workbook_id` | EXISTS | SUPABASE_SCHEMA.sql line 121 |
| `idx_dashboard_widgets_user_id` | MISSING | Table doesn't exist |
| `idx_dashboard_widgets_created_by` | MISSING | Table doesn't exist |

### RLS Policy Verification

| Table | RLS Status | Notes |
|-------|------------|-------|
| `workbooks` | EXISTS | SUPABASE_RLS.sql has policies using `auth.uid()` |
| `worksheets` | EXISTS | RLS policies defined |
| `column_metadata` | EXISTS | RLS policies defined |
| `worksheet_rows` | EXISTS | RLS policies defined |
| `dashboard_widgets` | MISSING | No RLS policies defined |
| `user_roles` | EXISTS | RLS policies defined |
| `audit_logs` | EXISTS | RLS policies defined |
| `users` | NONE | No RLS in schema |
| `roles` | NONE | No RLS in schema |
| `permissions` | NONE | No RLS in schema |
| `role_permissions` | NONE | No RLS in schema |
| `app_themes` | EXISTS | THEME_STUDIO_SQL.sql policies defined |
| `user_presence` | MISSING | No RLS defined |
| `workspace_assignments` | NONE | No RLS defined |
| `workspace_notes` | NONE | No RLS defined |
| `permission_requests` | MISSING | Table doesn't exist |

### Missing Tables Summary

```sql
-- Tables missing from expected schema:
permission_requests
user_presence
workspace_assignments  
workspace_notes
```

### Missing Indexes Summary

```sql
-- Indexes missing (due to missing tables):
idx_dashboard_widgets_user_id
idx_dashboard_widgets_created_by
```

### Migration Status

| Migration File | Purpose | Applied Status |
|----------------|---------|----------------|
| SUPABASE_SCHEMA.sql | Core workbook schema | Partial - some tables may be missing |
| WORKSPACE_ASSIGNMENTS_MIGRATION.sql | Workspace features | Not applied (separate file) |
| SYSTEM_ROLES_MIGRATION.sql | System roles | Implemented but incompatible with custom auth |
| DATABASE_AUTH_MIGRATION.sql | Auth tables (conflicting) | Not used - superseded by SUPABASE_SCHEMA.sql |

---

*Audit performed without database connection. Verify with actual Supabase instance.*