# Workbook Table Mapping Report (Phase 1A‑2)

## Overview
The original implementation stored workbook rows in dynamically‑named tables
(`records_<uuid>`) but did **not** persist the table name on the `Sheet`
model. Row service logic therefore guessed the correct table by sorting all
`records_*` tables and picking the newest one – a fragile approach that could
mix data between workbooks.

This update introduces a reliable mapping:
* **Schema change** – added `records_table_name` column to `sheets`.
* **Upload flow** – `create_workbook` now writes the generated table name into
  that column.
* **Row service** – fetches the exact table name from the `Sheet` record.
* **Migration script** – `repair_sheet_table_mapping.py` repairs existing
  records by pairing unmapped sheets with available `records_*` tables.

---

## Model Changes
### `backend/app/models/sheet.py`
```python
class Sheet(Base):
    __tablename__ = "sheets"
    id = Column(Integer, primary_key=True, index=True)
    workbook_id = Column(Integer, ForeignKey("workbooks.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    row_count = Column(Integer, nullable=True)
    column_names = Column(JSON, nullable=True)
    col_count = Column(Integer, nullable=True)
    # NEW
    records_table_name = Column(String, nullable=True)
```

## Upload Logic Changes
### `backend/app/models/crud_helpers.py`
* After the dynamic `CREATE TABLE records_<uuid>` statement is executed, the
  generated name is saved on the `Sheet` instance (`sh.records_table_name =
  table_name`).
* The workbook commit now persists this mapping.

## Service Layer Changes
### `backend/app/services/row_service.py`
* `_get_records_table_name` no longer inspects the database; it simply reads the
  `records_table_name` column from the `Sheet` row.
* Errors are raised if the column is missing, ensuring developers notice a
  broken mapping immediately.

## Migration Script
### `backend/scripts/repair_sheet_table_mapping.py`
* Scans the database for all tables matching `records_*`.
* Retrieves `Sheet` rows where `records_table_name` is `NULL`.
* Pairs the unmapped sheets with the still‑unlinked record tables in creation
  order and updates the column.
* Safe to run on both SQLite and PostgreSQL – only reads and simple updates.

### Usage
```bash
python backend/scripts/repair_sheet_table_mapping.py
```
Run this once after deploying the schema change to back‑fill existing workbooks.

---

## Verification Steps
1. **Upload Workbook A** – a new workbook is uploaded; its sheet receives a
   populated `records_table_name`.
2. **Upload Workbook B** – a second workbook is uploaded; a separate table is
   created and stored on its sheet.
3. Using the row service:
   ```python
   from backend.app.services.row_service import create_row, get_rows
   # Sheet IDs returned by the upload endpoint
   create_row(sheet_a_id, {"col1": "A1"})
   create_row(sheet_b_id, {"col1": "B1"})
   assert len(get_rows(sheet_a_id)) == 1
   assert len(get_rows(sheet_b_id)) == 1
   ```
   The data is isolated – rows added to Sheet A never appear in Sheet B.

## Result
All required tasks have been completed:
* Model updated with `records_table_name`.
* Upload process stores the exact table name.
* Row service uses the stored name, removing the unsafe heuristic.
* Migration script provided for existing data.

*Report generated on 2026‑06‑09.*
