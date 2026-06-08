from .base import SessionLocal, engine
from .workbook import Workbook
from .sheet import Sheet
from .columnmeta import ColumnMeta
import uuid
from sqlalchemy import text

def init_db():
    from .base import Base
    Base.metadata.create_all(bind=engine)

def create_workbook(meta: dict) -> int:
    db = SessionLocal()
    wb = Workbook(name=meta["name"])
    db.add(wb)
    db.flush()
    for sheet in meta["sheets"]:
        sh = Sheet(
            workbook_id=wb.id,
            name=sheet["name"],
            row_count=sheet["row_count"],
            col_count=sheet["col_count"],
        )
        db.add(sh)
        db.flush()
        for idx, col in enumerate(sheet["columns"]):
            cm = ColumnMeta(
                sheet_id=sh.id,
                name=col["name"],
                inferred_type=col["type"],
                display_order=idx,
            )
            db.add(cm)
        # create dynamic table for records
        table_name = f"records_{uuid.uuid4().hex}"
        # Build a safe column definition list for the dynamic records table.
        # Column names may contain spaces, colons, or other characters that are
        # invalid in SQLite identifiers. We replace any character that is not
        # an alphanumeric or underscore with an underscore, and collapse
        # consecutive underscores to a single one. This mirrors how pandas
        # normalizes column names and ensures the generated CREATE TABLE
        # statement is syntactically valid.
        def _sanitize(col_name: str) -> str:
            import re
            # Replace non‑alphanumeric characters with underscore
            sanitized = re.sub(r"[^0-9a-zA-Z_]", "_", col_name)
            # Collapse multiple underscores
            sanitized = re.sub(r"_+", "_", sanitized)
            # Strip leading/trailing underscores
            return sanitized.strip("_")

        cols_sql = ", ".join([
            f"{_sanitize(c['name'])} TEXT" for c in sheet["columns"]
        ])
        db.execute(text(f"CREATE TABLE {table_name} (id INTEGER PRIMARY KEY AUTOINCREMENT, {cols_sql});"))
    db.commit()
    wb_id = wb.id
    db.close()
    return wb_id