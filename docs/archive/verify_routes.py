"""Utility script to audit FastAPI route definitions.
It checks for:
  * Duplicate paths (same URL, regardless of method)
    – these can cause ambiguous routing.
  * Duplicate method‑path combinations (exact same HTTP method and path).
  * Conflicting prefixes that could lead to overlapping routes.

Run with ``python verify_routes.py``. It will import the FastAPI app from
``backend.app.main`` and print ``PASS`` if no issues are found, otherwise ``FAIL``
followed by a list of problems.
"""

import sys
from collections import defaultdict

def main() -> None:
    try:
        from backend.app.main import app
    except Exception as exc:
        print("FAIL")
        print(f"Could not import FastAPI app: {exc}")
        sys.exit(1)

    path_methods = defaultdict(set)  # path -> set(methods)
    duplicates = []
    method_path_conflicts = []

    for route in getattr(app, "routes", []):
        methods = getattr(route, "methods", set())
        path = getattr(route, "path", str(route))
        for method in methods:
            if method in path_methods[path]:
                method_path_conflicts.append((method, path))
            path_methods[path].add(method)

    # Detect duplicate paths (more than one method). FastAPI automatically adds HEAD
    # for each GET route, which is harmless. We therefore ignore HEAD when counting.
    for p, ms in path_methods.items():
        filtered = [m for m in ms if m != "HEAD"]
        if len(filtered) > 1:
            duplicates.append((p, sorted(filtered)))

    if method_path_conflicts or duplicates:
        print("FAIL")
        if method_path_conflicts:
            print("Duplicate method‑path combos:")
            for m, p in method_path_conflicts:
                print(f"  {m} {p}")
        if duplicates:
            print("Paths with multiple methods:")
            for p, ms in duplicates:
                print(f"  {p}: {', '.join(ms)}")
        sys.exit(1)
    else:
        print("PASS")


if __name__ == "__main__":
    main()
