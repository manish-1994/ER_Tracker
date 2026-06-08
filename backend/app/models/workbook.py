from .base import Base
from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

class Workbook(Base):
    __tablename__ = "workbooks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
