"""Request logging middleware for FastAPI.

Provides a simple, structured log line for every incoming request:
    [REQ] METHOD PATH
    [RES] STATUS DURATIONms

The middleware is deliberately lightweight and uses the standard
`print` function so that logs appear in the console when the server
is started with `uvicorn`. In a production setting you would replace
`print` with a proper logger (e.g. `loguru` or `logging`).
"""

import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.time()
        method = request.method
        path = request.url.path
        print(f"[REQ] {method} {path}")
        response = await call_next(request)
        duration_ms = int((time.time() - start) * 1000)
        status = response.status_code
        print(f"[RES] {status} {duration_ms}ms")
        return response
