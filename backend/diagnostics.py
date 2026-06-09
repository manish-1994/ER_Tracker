"""Temporary diagnostics script for FastAPI route audit and tests.
It imports the FastAPI app, prints all registered routes, filters by keyword,
and runs a few TestClient requests.
"""

from fastapi import FastAPI
from fastapi.testclient import TestClient
import importlib
import sys
import os

# Ensure the repository root is on the import path so "backend" can be imported
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if repo_root not in sys.path:
    sys.path.insert(0, repo_root)

# Import the main FastAPI app instance
app_module = importlib.import_module("backend.app.main")
app: FastAPI = getattr(app_module, "app")

def print_routes(filter_kw: str | None = None):
    print("--- ALL ROUTES ---")
    for route in app.routes:
        methods = ",".join(sorted(route.methods))
        path = route.path
        name = getattr(route, "name", "<no name>")
        if filter_kw is None or filter_kw in path:
            print(f"{methods}\t{path}\t{name}")
    print("--- END ROUTES ---\n")

def audit():
    # Phase 1 – full route list
    print_routes()
    # Phase 1 filters
    for kw in ["workbook", "profile", "health", "user", "admin"]:
        print(f"--- Routes containing '{kw}' ---")
        print_routes(filter_kw=kw)

    # Phase 2 – raw HTTP requests using TestClient (no follow redirects)
    client = TestClient(app)
    def do_req(method: str, url: str):
        # TestClient uses the name 'follow_redirects' instead of 'allow_redirects'
        resp = client.request(method, url, follow_redirects=False)
        print(f"{method} {url} -> {resp.status_code}")
        for k, v in resp.headers.items():
            print(f"{k}: {v}")
        if resp.content:
            print("Body:", resp.text)
        print()

    print("--- TestClient Requests (no redirects) ---")
    for url in ["/api/workbooks", "/api/workbooks/", "/api/profile", "/api/profile/", "/health", "/api/health"]:
        do_req("GET", url)

    # Phase 6 & 7 – profile and workbook with JWT (placeholder, no token provided)
    print("--- Auth tests (no token) ---")
    for url in ["/api/profile", "/api/profile/", "/api/workbooks", "/api/workbooks/"]:
        do_req("GET", url)

    # Phase 8 – health checks
    print("--- Health checks ---")
    for url in ["/health", "/api/health"]:
        do_req("GET", url)

if __name__ == "__main__":
    audit()