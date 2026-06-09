"""Audit FastAPI routes for trailing‑slash consistency.

The script loads the FastAPI ``app`` instance and iterates over ``app.routes``.
It builds a map of normalized paths (without a trailing slash) to the original
paths and HTTP methods.  If multiple routes differ only by the presence of a
trailing slash, they are reported as a potential 307 redirect source.

The output is a CSV‑like table:
Method,Route,Redirect?,Frontend‑Call (placeholder),Backend‑Route
"""

import sys, os
# Ensure the project root is on the import path when executing this script directly
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)
from backend.app.main import app

def normalize(path: str) -> str:
    return path.rstrip('/') or '/'  # keep root as '/'

def audit():
    # Build mapping: (method, normalized_path) -> list of original paths
    mapping = {}
    for route in app.routes:
        methods = getattr(route, "methods", ["GET"])  # default GET
        path = getattr(route, "path", str(route))
        for method in methods:
            key = (method, normalize(path))
            mapping.setdefault(key, []).append(path)

    # Print header
    print("Method,Route,Redirect?,Frontend Call,Backend Route")
    for (method, norm_path), paths in sorted(mapping.items()):
        redirect = "Y" if len(paths) > 1 else "N"
        # Choose the non‑trailing version as the canonical backend route
        backend_route = paths[0]
        # Placeholder for frontend call – manual inspection needed
        frontend = "?"
        for p in paths:
            print(f"{method},{p},{redirect},{frontend},{backend_route}")

if __name__ == "__main__":
    audit()