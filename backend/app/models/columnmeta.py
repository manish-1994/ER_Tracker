from .base import Base
from sqlalchemy import Column, Integer, String, Boolean

class ColumnMeta(Base):
    __tablename__ = "columns"
    id = Column(Integer, primary_key=True, index=True)
    sheet_id = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    inferred_type = Column(String)
    is_hidden = Column(Boolean, default=False)
    display_order = Column(Integer)
