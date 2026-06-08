from .base import Base
from sqlalchemy import Column, Integer, String, ForeignKey, JSON


class Sheet(Base):
    __tablename__ = "sheets"
    id = Column(Integer, primary_key=True, index=True)
    workbook_id = Column(Integer, ForeignKey("workbooks.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    row_count = Column(Integer, nullable=True)
    # Store column names for quick reference (optional)
    column_names = Column(JSON, nullable=True)  # list of column names
    # Number of columns in the sheet – required by the upload logic.
    col_count = Column(Integer, nullable=True)
