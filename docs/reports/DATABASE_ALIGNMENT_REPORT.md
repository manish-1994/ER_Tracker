# DATABASE_ALIGNMENT_REPORT.md

## Section 1 – Tables Referenced by Frontend Code

| Table | Source Files |
|-------|--------------|
| `app_themes` | themeService.ts (Theme Studio) |
| `workbooks` | workbookService.ts, storageService.ts, MainLayout.tsx |
| `worksheets` | NOT referenced - frontend uses `sheets` |
| `sheets` | workbookService.ts, worksheetService.ts, storageService.ts, rowService.ts, schemaValidation.ts |
| `columns` | worksheetService.ts, rowService.ts |
| `worksheet_rows` | storageService.ts |
| `column_metadata` | storageService.ts |
| `user_roles` | authHelper.ts, workbookService.ts, roleService.ts, userService.ts, workspaceService.ts |
| `roles` | roleService.ts, authHelper.ts, userService.ts, workspaceService.ts |
| `permissions` | authHelper.ts, roleService.ts |
| `role_permissions` | authHelper.ts |
| `users` | workbookService.ts, storageService.ts, userService.ts, authHelper.ts |
| `audit_logs` | workbookService.ts, storageService.ts, auditService.ts |
| `dashboard_widgets` | dashboardWidgetService.ts, schemaValidation.ts |
| `user_presence` | presenceService.ts, schemaValidation.ts |
| `workspace_assignments` | workspaceService.ts, schemaValidation.ts |
| `workspace_notes` | workspaceService.ts |
| `permission_requests` | schemaValidation.ts (line 7) - REFERENCED BUT NO SERVICE USES IT |

## Section 2 – Tables Existing in Schema (SUPABASE_SCHEMA.sql)

| Table | Schema Source |
|-------|---------------|
| `workbooks` | lines 4-11 |
| `worksheets` | lines 14-21 (but frontend uses `sheets`) |
| `column_metadata` | lines 24-33 |
| `worksheet_rows` | lines 36-42 |
| `user_roles` | lines 45-51 |
| `audit_logs` | lines 54-62 |
| `users` | lines 65-71 |
| `roles` | lines 74-79 |
| `permissions` | lines 82-87 |
| `role_permissions` | lines 90-95 |
| `dashboard_widgets` | lines 97-114 |

## Section 3 – Missing Tables

| Table | Referenced In | Notes |
|-------|---------------|-------|
| `sheets` | workbookService.ts, worksheetService.ts, rowService.ts | Frontend expects this table, but schema defines `worksheets` |
| `columns` | worksheetService.ts, rowService.ts | Frontend expects this table, no schema definition |
| `dashboard_widgets` | dashboardWidgetService.ts | May not exist in live Supabase (causes 404) |
| `user_presence` | presenceService.ts | Fallback to localStorage exists but table missing |
| `workspace_assignments` | workspaceService.ts | Defined in WORKSPACE_ASSIGNMENTS_MIGRATION.sql but separate file |
| `workspace_notes` | workspaceService.ts | Defined in WORKSPACE_ASSIGNMENTS_MIGRATION.sql but separate file |
| `permission_requests` | schemaValidation.ts line 7 | Referenced but no service uses it |

## Section 4 – Unused Tables

| Table | Schema Defined | Frontend References |
|-------|---------------|-------------------|
| `worksheet_rows` | Yes | Only storageService.ts references |
| `column_metadata` | Yes | Only storageService.ts references |
| `permission_requests` | No | Only schemaValidation.ts references |

## Section 5 – Conflicting Table Names

| Conflict | Frontend Uses | Schema Has | Resolution Needed |
|----------|--------------|------------|-------------------|
| Worksheets naming | `sheets` | `worksheets` | Either rename frontend or rename schema |
| Column metadata | `columns` | `column_metadata` | Either rename frontend or rename schema |
| Workspace data | `workspace_assignments`, `workspace_notes` | NOT in SUPABASE_SCHEMA.sql | Apply WORKSPACE_ASSIGNMENTS_MIGRATION.sql |

## Section 6 – Priority Order for Schema Fixes

### Priority 1 (Critical - Causes 404 Errors)
1. `dashboard_widgets` - Used by DashboardBuilder, causes save failures
2. `user_presence` - Used by UserPresence, has localStorage fallback
3. `permission_requests` - Unknown purpose, referenced in validations

### Priority 2 (Critical - Naming Conflicts)
4. Resolve `sheets` vs `worksheets` naming conflict
5. Resolve `columns` vs `column_metadata` naming conflict

### Priority 3 (Required - Workspace Features)
6. `workspace_assignments` - Apply WORKSPACE_ASSIGNMENTS_MIGRATION.sql
7. `workspace_notes` - Apply WORKSPACE_ASSIGNMENTS_MIGRATION.sql

---

*Audit performed without database connection. Verify against actual Supabase instance.*