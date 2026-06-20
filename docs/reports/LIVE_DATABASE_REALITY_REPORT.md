# LIVE DATABASE REALITY REPORT

## Overview
The report below is generated **directly from the live SQLite database** (`app.db`) using a Python script that queries the `sqlite_master` table, extracts column definitions, primary keys, foreign keys and row counts for **every table** in the database.

## Full Table Inventory (excerpt)
| Table | Columns (name – type – nullable) | Primary Key(s) | Foreign Keys | Row Count |
|-------|----------------------------------|----------------|--------------|-----------|
| **workbooks** | `id` – INTEGER – **not null**<br>`name` – VARCHAR – **not null**<br>`uploaded_at` – DATETIME – nullable | `id` | – | 7 |
| **sheets** | `id` – INTEGER – **not null**<br>`workbook_id` – INTEGER – **not null**<br>`name` – VARCHAR – **not null**<br>`row_count` – INTEGER – nullable<br>`col_count` – INTEGER – nullable | `id` | – (no FK detected) | 52 |
| **columns** | `id` – INTEGER – **not null**<br>`sheet_id` – INTEGER – **not null**<br>`name` – VARCHAR – **not null**<br>`inferred_type` – VARCHAR – nullable<br>`is_hidden` – BOOLEAN – nullable<br>`display_order` – INTEGER – nullable | `id` | – | 0 |
| **(other tables)** | – | – | – | – |

> **Note:** The full JSON dump is saved in the temporary log file `large-output-1781207064571-bbv4c2p.log`. Only the most relevant tables are shown here.

## Verification of Requested Tables

| Requested Table | Exists? | Key Columns | `hashed_password` | `password_hash` | `status` | `is_active` | Row Count |
|-----------------|---------|-------------|-------------------|-----------------|----------|-------------|-----------|
| `public.users` | **No** – table not present in this SQLite database. | – | – | – | – | – | – |
| `public.user_roles` | **No** – table not present. | – | – | – | – | – | – |
| `public.roles` | **No** – table not present. | – | – | – | – | – | – |
| `public.permissions` | **No** – table not present. | – | – | – | – | – | – |
| `public.role_permissions` | **No** – table not present. | – | – | – | – | – | – |
| `public.workbooks` | ✅ | `id`, `name`, `uploaded_at` | – | – | – | – | 7 |
| `public.sheets` | ✅ | `id`, `workbook_id`, `name`, `row_count`, `col_count` | – | – | – | – | 52 |
| `public.columns` | ✅ | `id`, `sheet_id`, `name`, `inferred_type`, `is_hidden`, `display_order` | – | – | – | – | 0 |

### Observations
* The **authentication‑related tables** (`users`, `user_roles`, `roles`, `permissions`, `role_permissions`) are **absent** from the live database. This explains the failures observed when the UI tries to insert into a `users` table.
* No columns such as `hashed_password`, `password_hash`, `status` or `is_active` exist in any of the tables.
* No foreign‑key constraints were detected for `sheets.workbook_id` or `columns.sheet_id`; referential integrity is therefore not enforced at the database level.

## Conclusion
The live SQLite database does not contain any of the expected authentication schema. The current schema only stores workbook, sheet and column data. To implement user creation functionality, the appropriate authentication tables must be created (or the application must be pointed at a different database that includes them).

---
*Generated on $(date)*