"""FastAPI entry point for the Excel Dashboard Generator MVP.

This file sets up the FastAPI instance, includes routers for upload,
sheet metadata and CRUD operations, and configures the SQLite database
connection using SQLAlchemy.
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse
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
from .health.router import router as health_router
from .core.config import settings
import logging
import traceback
import time

# Configure centralized logging
log_format = "[%(asctime)s] %(levelname)s %(message)s"
logging.basicConfig(level=logging.DEBUG if getattr(settings, "DEBUG", False) else logging.INFO,
                    format=log_format)
logger = logging.getLogger(__name__)

# Disable automatic redirect of trailing slashes – we will use a strict no‑slash convention
app = FastAPI(title="Excel Dashboard Generator", version="0.1.0", redirect_slashes=False)

# The custom trailing‑slash stripping middleware has been removed.
# FastAPI's built‑in redirect handling is disabled via `redirect_slashes=False`.

# ---------------------------------------------------------------------------
# Request logging middleware (Section 4)
# ---------------------------------------------------------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"{request.method} {request.url.path}")
    response = await call_next(request)
    return response

# ---------------------------------------------------------------------------
# Global exception handler (Section 3)
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    logger.error("""\nRequest Path: {path}\nMethod: {method}\nStatus Code: 500\nException Type: {etype}\nException Message: {msg}\nStack Trace:\n{tb}""".format(
        path=request.url.path,
        method=request.method,
        etype=type(exc).__name__,
        msg=str(exc),
        tb=tb,
    ))
    return HTTPException(status_code=500, detail="Internal Server Error")

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
    # The users router from `backend/app/users/router.py` does not expose a POST endpoint for creating users.
    # It conflicts with the router that does expose POST (`backend/app/routers/users.py`).
    # Therefore we disable this duplicate registration to allow the correct router to handle `/api/users`.
    # app.include_router(users_router, prefix="/api", tags=["users"])  # disabled to avoid 405
# Include the users router without an extra "/api" prefix to avoid duplicate paths like "/api/api/users"
app.include_router(users_router_module.router, tags=["users"])
app.include_router(profile_router.router, prefix="/api", tags=["profile"])
app.include_router(workbooks_router, prefix="/api", tags=["workbooks"])
app.include_router(worksheets_router, prefix="/api", tags=["worksheets"])
# Health endpoint (no /api prefix – it is a simple GET for frontend health check)
app.include_router(health_router, tags=["Health"])
# Alias for health endpoint under /api/health
@app.get("/api/health", tags=["Health"])
def health_api() -> dict:
    # Reuse the health router's implementation
    from backend.app.health.router import health as health_fn
    return health_fn()

# Startup event to initialize DB, seed RBAC data, and log system info
@app.on_event("startup")
def startup_event():
    """Initialize database, seed RBAC, and emit startup diagnostics.

    * Creates tables if missing.
    * Seeds roles, permissions and the default ``superadmin`` user.
    * Stores a ``startup_timestamp`` on ``app.state`` for uptime calculations.
    * Logs PID, environment, database URL and route count.
    """
    from .models.crud_helpers import init_db
    from .core import seed
    import os
    from .core.config import settings

    # Record startup time for uptime metric used by /health
    app.state.startup_timestamp = time.time()

    # Initialise DB and seed data
    init_db()
    from .models.base import SessionLocal
    db = SessionLocal()
    try:
        seed.initialize(db)
    finally:
        db.close()

    # Emit startup diagnostics (plain text for easy reading)
    print("=== FASTAPI STARTUP ===")
    print(f"PID: {os.getpid()}")
    print(f"Environment: {getattr(settings, 'ENVIRONMENT', 'development')}")
    print(f"Database URL: {getattr(settings, 'DATABASE_URL', 'sqlite:///app.db')}")
    print(f"Total routes: {len(app.routes)}")
    print("=== END STARTUP ===")

# Root endpoint for quick health check
@app.get("/")
def read_root():
    return {"message": "Excel Dashboard Generator API is running"}
