from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..models.workbook import Workbook
from ..models.sheet import Sheet
from ..models.base import SessionLocal

router = APIRouter(prefix="/workbooks", tags=["workbooks"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=list[dict])
def list_workbooks(db: Session = Depends(get_db)):
    # Convert ORM objects to plain dictionaries for FastAPI response validation
    workbooks = db.query(Workbook).all()
    result = []
    for wb in workbooks:
        result.append({
            "id": wb.id,
            "name": wb.name,
            "uploaded_at": wb.uploaded_at.isoformat() if wb.uploaded_at else None,
        })
    return result

@router.get("/{workbook_id}", response_model=dict)
def get_workbook(workbook_id: int, db: Session = Depends(get_db)):
    wb = db.query(Workbook).filter(Workbook.id == workbook_id).first()
    if not wb:
        raise HTTPException(status_code=404, detail="Workbook not found")
    return wb

@router.delete("/{workbook_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workbook(workbook_id: int, db: Session = Depends(get_db)):
    wb = db.query(Workbook).filter(Workbook.id == workbook_id).first()
    if not wb:
        raise HTTPException(status_code=404, detail="Workbook not found")
    db.delete(wb)
    db.commit()
    return

@router.get("/{workbook_id}/worksheets", response_model=list[dict])
def list_worksheets(workbook_id: int, db: Session = Depends(get_db)):
    wb = db.query(Workbook).filter(Workbook.id == workbook_id).first()
    if not wb:
        raise HTTPException(status_code=404, detail="Workbook not found")
    return db.query(Sheet).filter(Sheet.workbook_id == workbook_id).all()
