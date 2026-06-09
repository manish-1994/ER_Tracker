from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..models.base import get_db
from ..auth.dependencies import get_current_active_user, require_role
from ..auth.models import Role, Permission

router = APIRouter(prefix="/api/roles", tags=["roles"])

@router.get("", response_model=list[dict])
def list_roles(db: Session = Depends(get_db), _: dict = Depends(require_role("SuperAdmin"))):
    """Return all roles with their permissions."""
    roles = db.query(Role).all()
    result = []
    for role in roles:
        result.append({
            "id": role.id,
            "name": role.name,
            "description": role.description,
            "permissions": [{"id": p.id, "name": p.name, "description": p.description} for p in role.permissions],
        })
    return result

@router.post("", status_code=status.HTTP_201_CREATED)
def create_role(name: str, description: str = "", permission_ids: list[int] = [], db: Session = Depends(get_db), _: dict = Depends(require_role("SuperAdmin"))):
    if db.query(Role).filter(Role.name == name).first():
        raise HTTPException(status_code=400, detail="Role already exists")
    role = Role(name=name, description=description)
    if permission_ids:
        perms = db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
        role.permissions = perms
    db.add(role)
    db.commit()
    db.refresh(role)
    return {"id": role.id, "name": role.name}

@router.put("/{role_id}")
def update_role(role_id: int, name: str | None = None, description: str | None = None, permission_ids: list[int] | None = None, db: Session = Depends(get_db), _: dict = Depends(require_role("SuperAdmin"))):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if name:
        role.name = name
    if description:
        role.description = description
    if permission_ids is not None:
        perms = db.query(Permission).filter(Permission.id.in_(permission_ids)).all()
        role.permissions = perms
    db.commit()
    return {"msg": "updated"}

@router.delete("/{role_id}")
def delete_role(role_id: int, db: Session = Depends(get_db), _: dict = Depends(require_role("SuperAdmin"))):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    db.delete(role)
    db.commit()
    return {"msg": "deleted"}
