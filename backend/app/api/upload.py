from fastapi import APIRouter, File, UploadFile, HTTPException
import uuid, shutil
from pathlib import Path

from ..services.excel_parser import parse_workbook
from ..models.crud_helpers import create_workbook

router = APIRouter()

@router.post("/upload")
def upload_workbook(file: UploadFile = File(...)):
    if not file.filename.endswith('.xlsx'):
        raise HTTPException(status_code=400, detail='Only .xlsx files are supported')
    tmp_dir = Path('tmp')
    tmp_dir.mkdir(exist_ok=True)
    tmp_path = tmp_dir / f"{uuid.uuid4()}.xlsx"
    with tmp_path.open('wb') as buffer:
        shutil.copyfileobj(file.file, buffer)
    wb_meta = parse_workbook(tmp_path)
    workbook_id = create_workbook(wb_meta)
    # Close the uploaded file handle; we no longer attempt to delete the temporary file
    # to avoid a Windows file‑locking issue (PermissionError). The tmp directory can be
    # cleaned up periodically if needed.
    try:
        file.file.close()
    except Exception:
        pass
    return {"workbook_id": workbook_id, "sheets": wb_meta['sheets']}