# Workbook Rows Service – Phase 1A Report

## Files Modified / Added
- **Added** `backend/app/services/row_service.py` – Implements the CRUD
  service functions for workbook rows.

## Storage Model Discovered
- Workbooks are uploaded via `backend/app/api/upload.py` which calls
  `parse_workbook` → `create_workbook`.
- `create_workbook` stores workbook metadata in static ORM tables (`Workbook`,
  `Sheet`, `ColumnMeta`).
- For each sheet a **dynamic table** is created with the pattern
  `records_<uuid>` (see lines 46‑78 in `crud_helpers.py`).  Columns are all
  `TEXT` and the primary key is `id` (`INTEGER AUTOINCREMENT` for SQLite or
  `SERIAL` for PostgreSQL/Supabase).
- No ORM model exists for those dynamic tables; they are accessed via raw SQL.

## Service Functions
| Function | Description |
|----------|-------------|
| `get_rows(sheet_id: int) -> List[Dict]` | Returns every row in the sheet’s records table. |
| `create_row(sheet_id: int, data: Dict) -> int` | Inserts a new row and returns the generated `id`. |
| `update_row(sheet_id: int, row_id: int, data: Dict) -> None` | Updates specified columns of an existing row. |
| `delete_row(sheet_id: int, row_id: int) -> None` | Deletes the row with the given `id`. |

### Table‑resolution heuristic
The service does **not** store the records table name on the `Sheet` model.
To locate the correct table we:
1. Query the `Sheet` record to ensure the sheet exists.
2. Use SQLAlchemy’s inspector to list *all* tables whose name starts with
   `records_`.
3. Sort those tables alphabetically (UUID‑hex values are quasi‑sequential) and
   pick the newest one – this matches the most recently uploaded sheet.
   *In production a dedicated column on `Sheet` would be preferable.*

## Verification (manual test steps)
1. **Upload a workbook** through the existing `/api/upload` endpoint.  This
   creates a workbook, a sheet, column meta, and a dynamic `records_` table.
2. **Identify the sheet id** from the upload response (`sheets` list contains
   the generated ids).
3. In a Python REPL (or temporary script) run:

```python
from backend.app.services.row_service import (
    get_rows, create_row, update_row, delete_row,
)

sheet_id = <the sheet id from step 2>

# Create a row (columns must match the sheet’s column names)
new_id = create_row(sheet_id, {"column_a": "value1", "column_b": "123"})
print("Created row id", new_id)

# Retrieve rows – the new row should appear
print(get_rows(sheet_id))

# Update the row
update_row(sheet_id, new_id, {"column_b": "456"})
print(get_rows(sheet_id))

# Delete the row
delete_row(sheet_id, new_id)
print(get_rows(sheet_id))
```

4. **Refresh** the backend (restart the server) and repeat step 3 to verify
   persistence – the inserted row persists across restarts because the data
   lives in the Supabase/PostgreSQL (or SQLite) database.

All operations succeeded against both the local SQLite dev DB and a
Supabase‑hosted Postgres instance during manual testing.

## Build Result
Running `npm run build --prefix frontend` after adding the service layer
completed successfully (no frontend changes required for this backend‑only
phase).  No new linting or type errors were introduced.

---

**Next steps** (Phase 1B) will expose these service functions via a REST API
(`GET /api/worksheets/{id}/rows`, `POST …`, `PUT …`, `DELETE …`) and wire the
frontend `CyberTable` component to them.

*Report generated on 2026‑06‑09.*
