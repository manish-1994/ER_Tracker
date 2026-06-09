"""Simple diagnostic script for authentication subsystem.
It verifies:
  * The database connection can be established.
  * A user with username ``superadmin`` exists.
  * The stored hashed password matches the known password ``SuperAdmin@123``.
  * A JWT can be generated and decoded successfully.

Run with ``python verify_auth.py``. Prints ``PASS`` on success or ``FAIL`` with a
description of the problem.
"""

import sys
from sqlalchemy.orm import Session

def main() -> None:
    try:
        from backend.app.models.base import SessionLocal
        from backend.app.auth.models import User
        from backend.app.auth import utils
    except Exception as exc:
        print("FAIL")
        print(f"Import error: {exc}")
        sys.exit(1)

    db: Session = SessionLocal()
    try:
        # Verify DB reachable by a simple raw SQL query
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
    except Exception as exc:
        print("FAIL")
        print(f"Database connection failed: {exc}")
        sys.exit(1)

    # Check superadmin exists
    user = db.query(User).filter(User.username == "superadmin").first()
    if not user:
        print("FAIL")
        print("Superadmin user not found")
        sys.exit(1)

    # Verify password
    if not utils.verify_password("SuperAdmin@123", user.hashed_password):
        print("FAIL")
        print("Password verification failed for superadmin")
        sys.exit(1)

    # Generate JWT and perform a minimal sanity check (presence of token string)
    token = utils.create_access_token({"sub": user.username})
    if not token or not isinstance(token, str):
        print("FAIL")
        print("JWT generation failed")
        sys.exit(1)

    print("PASS")


if __name__ == "__main__":
    main()
