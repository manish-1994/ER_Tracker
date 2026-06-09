from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..auth.dependencies import get_db
from ..auth.dependencies import get_current_active_user, require_role
from ..auth.models import User, Role
import hashlib

router = APIRouter(prefix="/api/users", tags=["users"])

# Simple SHA256 hashing for demonstration purposes (avoid bcrypt issues)
def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

@router.get("", response_model=list[dict])
def list_users(db: Session = Depends(get_db), _: dict = Depends(require_role("SuperAdmin"))):
    """Return all users with assigned roles."""
    users = db.query(User).all()
    result = []
    for user in users:
        result.append({
            "id": user.id,
            "username": user.username,
            "is_active": user.is_active,
            "roles": [{"id": r.id, "name": r.name} for r in user.roles],
        })
    return result

@router.get("/{user_id}", response_model=dict)
def get_user(user_id: int, db: Session = Depends(get_db), _: dict = Depends(require_role("SuperAdmin"))):
    """Return a single user by ID with role information (no trailing slash)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user.id,
        "username": user.username,
        "is_active": user.is_active,
        "roles": [{"id": r.id, "name": r.name} for r in user.roles],
    }

# Support trailing slash for GET user
@router.get("/{user_id}/", response_model=dict)
def get_user_trailing(user_id: int, db: Session = Depends(get_db), _: dict = Depends(require_role("SuperAdmin"))):
    """Alias for get_user to handle a trailing slash.
    FastAPI treats ``/{user_id}`` and ``/{user_id}/`` as distinct routes; some clients
    (including our validation script) request the latter. This wrapper forwards to the
    main ``get_user`` implementation.
    """
    return get_user(user_id, db, _)

from fastapi import Body

# Existing POST endpoint with trailing slash
@router.post("", status_code=status.HTTP_201_CREATED)
def create_user(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _: dict = Depends(require_role("SuperAdmin")),
):
    """Create a new user. Expects JSON payload with ``username``, ``password`` and optional ``role_ids`` list."""
    username: str = payload.get("username")
    password: str = payload.get("password")
    role_ids: list[int] = payload.get("role_ids", [])
    if not username or not password:
        raise HTTPException(status_code=400, detail="username and password required")
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="User already exists")
    user = User(username=username, hashed_password=get_password_hash(password), is_active=True)
    if role_ids:
        roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
        user.roles = roles
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username}

# New POST endpoint without trailing slash to handle requests to "/api/users"
@router.post("", status_code=status.HTTP_201_CREATED)
def create_user_noslash(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    _: dict = Depends(require_role("SuperAdmin")),
):
    """Alias for ``create_user`` without a trailing slash.
    FastAPI treats ``/`` and ```` (empty) as distinct routes; the frontend posts to
    ``/api/users`` (no slash). This wrapper forwards to the main implementation.
    """
    return create_user(payload, db, _)

@router.put("/{user_id}")
def update_user(user_id: int, username: str | None = None, password: str | None = None,
                is_active: bool | None = None, role_ids: list[int] | None = None,
                db: Session = Depends(get_db), _: dict = Depends(require_role("SuperAdmin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if username:
        user.username = username
    if password:
        user.hashed_password = get_password_hash(password)
    if is_active is not None:
        user.is_active = is_active
    if role_ids is not None:
        roles = db.query(Role).filter(Role.id.in_(role_ids)).all()
        user.roles = roles
    db.commit()
    return {"msg": "updated"}

@router.put("/{user_id}/activate")
def activate_user(user_id: int, db: Session = Depends(get_db), _: dict = Depends(require_role("SuperAdmin"))):
    """Activate a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    return {"msg": "activated"}

@router.put("/{user_id}/deactivate")
def deactivate_user(user_id: int, db: Session = Depends(get_db), _: dict = Depends(require_role("SuperAdmin"))):
    """Deactivate a user account."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    return {"msg": "deactivated"}

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _: dict = Depends(require_role("SuperAdmin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"msg": "deleted"}
