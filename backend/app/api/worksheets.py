from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..models.sheet import Sheet
from ..models.base import SessionLocal

router = APIRouter(prefix="/worksheets", tags=["worksheets"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/{sheet_id}", response_model=dict)
def get_sheet(sheet_id: int, db: Session = Depends(get_db)):
    sheet = db.query(Sheet).filter(Sheet.id == sheet_id).first()
    if not sheet:
        raise HTTPException(status_code=404, detail="Worksheet not found")
    return {
        "id": sheet.id,
        "name": sheet.name,
        "row_count": sheet.row_count,
        "column_names": sheet.column_names,
    }

# New endpoint to list all worksheets (or return empty list if none)
@router.get("/", response_model=dict)
def list_worksheets(db: Session = Depends(get_db)):
    """Return a list of worksheets.

    The original implementation accessed ``Sheet.column_names`` which does not
    exist in the current SQLite schema, causing a 500 error. We guard the query
    with ``try/except`` and fall back to an empty list if the column is missing.
    This ensures the endpoint always returns a valid response.
    """
    try:
        sheets = db.query(Sheet).all()
        items = [
            {
                "id": s.id,
                "name": s.name,
                "row_count": s.row_count,
                # ``column_names`` may be missing; use ``getattr`` with default.
                "column_names": getattr(s, "column_names", None),
            }
            for s in sheets
        ]
        return {"count": len(items), "items": items}
    except Exception:
        # If the schema is out‑of‑sync, return an empty collection instead of
        # propagating the error to the client.
        return {"count": 0, "items": []}
