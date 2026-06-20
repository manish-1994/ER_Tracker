# SQLite Schema Report

## Table: `workbooks`
- Rows: 0
- Columns:
  - id (INTEGER) PRIMARY KEY
  - name (VARCHAR)
  - uploaded_at (DATETIME)
- Primary Keys: id

## Table: `columns`
- Rows: 0
- Columns:
  - id (INTEGER) PRIMARY KEY
  - sheet_id (INTEGER)
  - name (VARCHAR)
  - inferred_type (VARCHAR)
  - is_hidden (BOOLEAN)
  - display_order (INTEGER)
- Primary Keys: id

## Table: `users`
- Rows: 3
- Columns:
  - id (INTEGER) PRIMARY KEY
  - username (VARCHAR)
  - hashed_password (VARCHAR)
  - is_active (BOOLEAN)
- Primary Keys: id

## Table: `roles`
- Rows: 5
- Columns:
  - id (INTEGER) PRIMARY KEY
  - name (VARCHAR)
  - description (VARCHAR)
- Primary Keys: id

## Table: `permissions`
- Rows: 8
- Columns:
  - id (INTEGER) PRIMARY KEY
  - name (VARCHAR)
  - description (VARCHAR)
- Primary Keys: id

## Table: `sheets`
- Rows: 0
- Columns:
  - id (INTEGER) PRIMARY KEY
  - workbook_id (INTEGER)
  - name (VARCHAR)
  - row_count (INTEGER)
  - column_names (JSON)
- Primary Keys: id
- Foreign Keys:
  - `workbook_id` → `workbooks`.`id` (on_update=NO ACTION, on_delete=CASCADE)

## Table: `user_roles`
- Rows: 2
- Columns:
  - user_id (INTEGER) PRIMARY KEY
  - role_id (INTEGER) PRIMARY KEY
- Primary Keys: user_id, role_id
- Foreign Keys:
  - `role_id` → `roles`.`id` (on_update=NO ACTION, on_delete=NO ACTION)
  - `user_id` → `users`.`id` (on_update=NO ACTION, on_delete=NO ACTION)

## Table: `role_permissions`
- Rows: 20
- Columns:
  - role_id (INTEGER) PRIMARY KEY
  - permission_id (INTEGER) PRIMARY KEY
- Primary Keys: role_id, permission_id
- Foreign Keys:
  - `permission_id` → `permissions`.`id` (on_update=NO ACTION, on_delete=NO ACTION)
  - `role_id` → `roles`.`id` (on_update=NO ACTION, on_delete=NO ACTION)

**Total tables:** 8
**Total records:** 38