# Live Schema Audit Report

This document details the live schema structure of the Supabase backend databases audited for implementation correctness.

## Audited Tables & Columns

### 1. `workbooks`
Primary registry of uploaded workbook files.
- `id` (integer, Primary Key)
- `name` (text)
- `uploaded_at` (timestamp with time zone)

### 2. `sheets`
The sheet nodes contained in each workbook.
- `id` (integer, Primary Key)
- `workbook_id` (integer, Foreign Key -> workbooks.id)
- `name` (text)
- `row_count` (integer, nullable)
- `col_count` (integer, nullable)
- `column_names` (array of text, nullable)

### 3. `columns`
Metadata tracking each sheet column definition.
- `id` (integer, Primary Key)
- `sheet_id` (integer, Foreign Key -> sheets.id)
- `name` (text) - Holds raw Excel display name.
- `inferred_type` (text)
- `is_hidden` (boolean)
- `display_order` (integer)

### 4. `users`
Operational user profiles database.
- `id` (integer, Primary Key)
- `username` (text, unique)
- `hashed_password` (text)
- `is_active` (boolean)

### 5. `roles`
Clearance tier configurations.
- `id` (integer, Primary Key)
- `name` (text, unique)
- `description` (text, nullable)

### 6. `user_roles`
Bridges users to their assigned roles.
- `user_id` (integer, Foreign Key -> users.id)
- `role_id` (integer, Foreign Key -> roles.id)

### 7. `role_permissions`
Bridges role definitions to permission rules.
- `role_id` (integer, Foreign Key -> roles.id)
- `permission_id` (integer, Foreign Key -> permissions.id)

### 8. `permissions`
Action rules for modules.
- `id` (integer, Primary Key)
- `name` (text)

### 9. `audit_logs`
System operational history logs.
- `id` (uuid, Primary Key)
- `timestamp` (timestamp with time zone)
- `user_id` (integer, nullable)
- `action` (text)
- `table_name` (text)
- `record_id` (text)
- `payload` (jsonb)

### 10. `records_<uuid>`
Tables populated dynamically by the ingest system. Contains the sheet rows, where column keys correspond to lowercased, sanitized column names:
- `id` (integer, Primary Key)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- Dynamic lowercased columns representing the sheet headers.
