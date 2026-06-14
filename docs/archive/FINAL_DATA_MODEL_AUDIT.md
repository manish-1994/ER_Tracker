# FINAL_DATA_MODEL_AUDIT.md

## Supabase Tables Currently Used

| Table | Purpose |
|-------|---------|
| `workbooks` | Stores workbook metadata (id, name, owner, timestamps). |
| `worksheets` | Stores worksheet metadata (id, workbook_id, title, position, timestamps). |
| `column_metadata` | Stores column (header) definitions for each worksheet. |
| `records_<uuid>` *(dynamic tables)* | Stores **row data** for each worksheet. One table is created per worksheet at upload time; the name is stored on the `sheets` record (`records_table_name`). |
| `user_roles` | RBAC mapping of users to workbooks (owner/editor/viewer). |
| `audit_logs` | Audit trail of inserts/updates/deletes performed on Supabase tables. |
| `worksheet_rows` | Legacy JSONB payload table – **no longer used** by the current implementation. |

## Row Storage Strategy

* **Current strategy:** Each worksheet has its own **dynamic table** named `records_<uuid>` (e.g., `records_9f1a2b3c4d5e6f`). The table name is generated during workbook upload (`crud_helpers.create_workbook`) and saved on the `sheets` record (`records_table_name`). All CRUD operations (`rowService`) resolve this name via `_get_records_table_name` and execute raw SQL against that table.
* **Legacy strategy:** A single `worksheet_rows` table with a JSONB `data` column existed in earlier versions; it is now obsolete and not referenced by any front‑end or back‑end code.

## Column (Header) Storage Strategy

* **Current strategy:** Column definitions are stored in the static `column_metadata` table. Each entry links to a worksheet (`worksheet_id`) and contains the internal name, display name, data type, and order.
* The older `columns` table referenced in earlier phases has been replaced by `column_metadata`.

## Migration Status

| Component | Current State | Migration Needed? | Notes |
|-----------|---------------|-------------------|-------|
| Row storage | Dynamic `records_<uuid>` tables (active) | **None** – already in use. | Legacy `worksheet_rows` table is obsolete; can be dropped after verification. |
| Column storage | `column_metadata` (active) | **None** – already in use. | Replaces former `columns` table. |
| RBAC & audit | `user_roles`, `audit_logs` (active) | **None** | Fully functional with Supabase RLS. |
| Legacy tables (`worksheet_rows`) | Exists but unused | **Remove** after confirming no data remains. |

---

*Report generated on 2026‑06‑10.*
