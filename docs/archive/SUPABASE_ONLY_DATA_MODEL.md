# Supabase‑Only Data Model & Migration Plan

## Overview
The application will run on **Vercel** with **Supabase** as the sole backend service. All workbook‑related data will be stored in a fixed set of Supabase tables. No dynamic PostgreSQL tables will be created at runtime – column definitions are stored as metadata and rows are persisted as JSONB objects.

---

## Tables

| Table | Primary Key | Description | Important Columns |
|-------|-------------|-------------|-------------------|
| **workbooks** | `id` (uuid) | Represents an uploaded workbook (Excel/CSV). | `id`, `name`, `owner_id`, `created_at`, `updated_at`, `deleted_at` |
| **worksheets** | `id` (uuid) | Individual sheets belonging to a workbook. | `id`, `workbook_id` (fk → workbooks.id), `title`, `position`, `created_at`, `updated_at` |
| **column_metadata** | `id` (uuid) | Stores the definition of each column for a worksheet. Allows dynamic column handling without altering the schema. | `id`, `worksheet_id` (fk → worksheets.id), `name`, `display_name`, `data_type`, `order`, `created_at`, `updated_at` |
| **worksheet_rows** | `id` (uuid) | One row per worksheet; the actual cell values are stored as a JSONB payload keyed by `column_metadata.name`. | `id`, `worksheet_id` (fk → worksheets.id), `data` (jsonb), `created_at`, `updated_at` |

### Relationships
+ `workbooks` 1‑* `worksheets`
+ `worksheets` 1‑* `column_metadata`
+ `worksheets` 1‑* `worksheet_rows`

---

## Column Types (Supported `data_type` values)
* `text`
* `number`
* `boolean`
* `date`
* `datetime`
* `json` (for complex nested structures)

---

## RBAC (Role‑Based Access Control)
Supabase **Row‑Level Security (RLS)** policies will enforce access:
1. **Owner** – full CRUD on workbooks they own.
2. **Editor** – can edit worksheets/rows in workbooks where they have `editor` role.
3. **Viewer** – read‑only access to worksheets.

Policies are defined per table, referencing a `user_roles` mapping table (not listed here) that links `user_id` → `workbook_id` with a role field.

---

## Audit Trail
All tables include `created_at`, `updated_at`, and `deleted_at`. Supabase **logflare** can capture every INSERT/UPDATE/DELETE via database webhooks.
Additional **audit_logs** table (optional) can store:
```
id (uuid)
user_id (uuid)
action (enum: INSERT, UPDATE, DELETE)
table_name (text)
record_id (uuid)
payload (jsonb) – snapshot of changed data
timestamp (timestamptz)
```

---

## Migration Plan
1. **Initial Schema Creation** – run a single Supabase migration script that creates the four core tables with the columns defined above and enables RLS.
2. **Add RLS Policies** – for each table, add policies for `owner`, `editor`, and `viewer` roles using `auth.uid()` and the `user_roles` mapping.
3. **Seed Data** – optional seed of a demo workbook/worksheet for UI testing.
4. **Deploy** – push migration to Supabase via the CLI (`supabase db push`).
5. **Vercel Integration** – configure environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
6. **Future Changes** – any schema change (e.g., new column metadata fields) will be added as incremental migration scripts.

---

## No Dynamic PostgreSQL Tables
All column changes are managed through records in **column_metadata**. The UI reads this metadata to render dynamic column headers. Adding or removing a column simply inserts or deletes a row in `column_metadata`; the underlying PostgreSQL table remains static.

---

## Next Steps (Implementation Phase)
* Build API endpoints that operate on the above tables (CRUD for workbooks, worksheets, column metadata, and rows).
* Hook the frontend to these endpoints using Supabase client libraries.
* Add UI components for column editing, row addition/deletion, and audit log display.

*Design only – no code changes have been made yet.*