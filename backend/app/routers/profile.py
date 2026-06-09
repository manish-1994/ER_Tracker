"""Profile router – provides endpoints for the currently authenticated user.

The frontend expects three endpoints under ``/api/profile``:
* ``GET /api/profile`` – return basic user details (username, email, full_name,
  roles and permissions).
* ``PUT /api/profile`` – update mutable fields (full_name, email).
* ``PUT /api/profile/password`` – change password after validating the current
  password.

All routes require an active, authenticated user. The ``get_current_active_user``
dependency (defined in ``backend/app/auth/dependencies.py``) returns the ORM
``User`` instance associated with the JWT token.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..auth.dependencies import get_db
from ..auth.dependencies import get_current_active_user
from ..auth.models import User, Role, Permission
# Removed passlib import; using SHA256 hashing instead

router = APIRouter(prefix="/profile", tags=["profile"])

# Simple SHA256 hashing for passwords
import hashlib


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hashlib.sha256(plain_password.encode('utf-8')).hexdigest() == hashed_password


def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()


@router.get("", response_model=dict)
def read_profile(current_user: User = Depends(get_current_active_user)):
    print("PROFILE ROUTE REACHED")
    """Return profile information for the authenticated user.

    The response includes basic user fields plus the list of roles and the
    permissions attached to those roles.
    """
    return {
        "id": current_user.id,
        "username": current_user.username,
        "full_name": getattr(current_user, "full_name", ""),
        "email": getattr(current_user, "email", ""),
        "roles": [{"id": r.id, "name": r.name} for r in current_user.roles],
        "permissions": [
            {"id": p.id, "name": p.name}
            for r in current_user.roles
            for p in r.permissions
        ],
    }


@router.put("/", status_code=status.HTTP_200_OK)
def update_profile(
    full_name: str | None = None,
    email: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Update mutable profile fields for the authenticated user."""
    if full_name is not None:
        setattr(current_user, "full_name", full_name)
    if email is not None:
        setattr(current_user, "email", email)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return {"msg": "profile updated"}


@router.put("/password", status_code=status.HTTP_200_OK)
def change_password(
    current_password: str,
    new_password: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Change the authenticated user's password after validating the current one."""
    if not verify_password(current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = get_password_hash(new_password)
    db.add(current_user)
    db.commit()
    return {"msg": "password updated"}
