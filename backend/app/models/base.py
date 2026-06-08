from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./app.db"

# Increase SQLite timeout to avoid "database is locked" errors when multiple
# connections try to write concurrently. The default timeout (5 seconds) can be
# insufficient for the rapid sequence of inserts performed during a workbook
# upload (workbook, sheets, column metadata, and dynamic record tables). By
# setting a longer timeout (30 seconds) we give SQLite more time to obtain the
# write lock before raising an OperationalError.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()