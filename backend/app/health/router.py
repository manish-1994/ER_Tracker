"""Health endpoint for the FastAPI application.

Provides a JSON payload containing basic runtime diagnostics that the
frontend admin panel can poll to display online/offline status and system
information.
"""

from fastapi import APIRouter
import os
import time
from datetime import datetime

router = APIRouter()

@router.get("/health", tags=["Health"])
def health() -> dict:
    """Return a lightweight health check.

    The response includes:
    * ``status`` – always ``"ok"`` when the endpoint is reachable.
    * ``database`` – fixed string ``"connected"`` (actual DB check is
      performed elsewhere on startup).
    * ``version`` – taken from the package version if available; fallback
      to ``"0.1.0"``.
    * ``environment`` – read from the ``ENVIRONMENT`` setting or default to
      ``"development"``.
    * ``pid`` – current process id.
    * ``route_count`` – number of routes registered in the FastAPI app.
    * ``timestamp`` – ISO‑8601 timestamp of the request.
    * ``database_path`` – path to the SQLite DB file.
    * ``uptime`` – seconds since the process started.
    """
    # Basic static information
    from backend.app.core.config import settings
    from backend.app.main import app

    pid = os.getpid()
    now = datetime.utcnow().isoformat() + "Z"
    # Approximate uptime using the process start time captured at import time
    uptime_seconds = time.time() - getattr(app.state, "startup_timestamp", time.time())

    return {
        "status": "ok",
        "database": "connected",
        "version": getattr(settings, "APP_VERSION", "0.1.0"),
        "environment": getattr(settings, "ENVIRONMENT", "development"),
        "pid": pid,
        "route_count": len(app.routes),
        "timestamp": now,
        "database_path": getattr(settings, "DATABASE_URL", "sqlite:///app.db"),
        "uptime": f"{int(uptime_seconds)}s",
    }

# Alias to expose the same health payload under the /api prefix (required for consistency with other routes)
@router.get("/api/health", tags=["Health"])
def health_api() -> dict:
    return health()
