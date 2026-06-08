from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..auth.dependencies import get_db
from ..auth.dependencies import get_current_active_user, require_role
from ..auth.models import User, Role
from passlib.context import CryptContext

router = APIRouter(prefix="/api/users", tags=["users"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

@router.get("/", response_model=list[dict])
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

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_user(username: str, password: str, role_ids: list[int] = [],
                db: Session = Depends(get_db), _: dict = Depends(require_role("SuperAdmin"))):
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

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _: dict = Depends(require_role("SuperAdmin"))):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"msg": "deleted"}
