"""Utility to parse an uploaded Excel file and extract metadata.

Uses pandas (with openpyxl engine) to read the workbook and infer basic
information needed by the backend.
"""

from pathlib import Path
import pandas as pd

def _infer_type(series: pd.Series) -> str:
    """Infer a simple type name for a pandas Series.

    The original implementation used ``pd.api.types.is_datetime_any_dtype`` which
    was removed in newer pandas versions. The correct modern helper is
    ``is_datetime64_any_dtype``. We also keep the numeric check and fall back to
    ``string`` for any other dtype.
    """
    # pandas provides ``is_datetime64_any_dtype`` to detect datetime‑like
    # columns. Using the newer function ensures compatibility with pandas 2.x.
    if pd.api.types.is_datetime64_any_dtype(series):
        return "date"
    if pd.api.types.is_numeric_dtype(series):
        return "number"
    return "string"

def parse_workbook(file_path: Path) -> dict:
    xl = pd.ExcelFile(file_path, engine="openpyxl")
    sheets_meta = []
    for sheet_name in xl.sheet_names:
        df = xl.parse(sheet_name)
        columns = []
        for col in df.columns:
            columns.append({"name": str(col), "type": _infer_type(df[col])})
        sheets_meta.append({
            "name": sheet_name,
            "row_count": len(df),
            "col_count": len(df.columns),
            "columns": columns,
        })
    return {"name": file_path.name, "sheets": sheets_meta}
