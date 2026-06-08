"""FastAPI entry point for the Excel Dashboard Generator MVP.

This file sets up the FastAPI instance, includes routers for upload,
sheet metadata and CRUD operations, and configures the SQLite database
connection using SQLAlchemy.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware

# Import routers
from .api.upload import router as upload_router
from .auth.router import router as auth_router
from .users.router import router as users_router
from .routers import users as users_router_module
from .routers import profile as profile_router
from .api.workbooks import router as workbooks_router
from .api.worksheets import router as worksheets_router
from .core.config import settings

app = FastAPI(title="Excel Dashboard Generator", version="0.1.0")

# Allow the frontend (usually localhost:5173) to call the API.
app.add_middleware(
    CORSMiddleware,
    # Restrict origins to known front‑end URLs while still allowing credentials
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.29.78:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(auth_router, prefix="/api", tags=["auth"])
app.include_router(users_router, prefix="/api", tags=["users"])
app.include_router(users_router_module.router, prefix="/api", tags=["users"])
app.include_router(profile_router.router, prefix="/api", tags=["profile"])
app.include_router(workbooks_router, prefix="/api", tags=["workbooks"])
app.include_router(worksheets_router, prefix="/api", tags=["worksheets"])

# Startup event to initialize DB and seed RBAC data
@app.on_event("startup")
def startup_event():
    """Initialize database tables and seed default RBAC entities.

    The existing ``init_db`` helper creates all tables. After that we invoke the
    new ``backend.app.core.seed.initialize`` function which ensures that the
    required roles, permissions and the default ``superadmin`` account exist.
    This replaces the previous hard‑coded admin user creation logic.
    """
    from .models.crud_helpers import init_db
    from .core import seed

    # Create tables if they do not exist
    init_db()

    # Seed RBAC roles, permissions and the superadmin user
    from .models.base import SessionLocal

    db = SessionLocal()
    try:
        seed.initialize(db)
    finally:
        db.close()

# Root endpoint for quick health check
@app.get("/")
def read_root():
    return {"message": "Excel Dashboard Generator API is running"}
