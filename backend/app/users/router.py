from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..auth import dependencies as auth_dep
from ..auth import schemas as auth_schemas
from ..auth import models as auth_models
from ..auth import utils as auth_utils

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=auth_schemas.UserSchema)
def read_current_user(current_user = Depends(auth_dep.get_current_user)):
    return current_user


@router.get("", response_model=list[auth_schemas.UserSchema])
def list_users(db: Session = Depends(auth_dep.get_db),
              _: bool = Depends(auth_dep.require_role("SuperAdmin"))):
    return db.query(auth_models.User).all()


@router.put("/{user_id}", response_model=auth_schemas.UserSchema)
def update_user(user_id: int, user_in: auth_schemas.UserCreateSchema,
                db: Session = Depends(auth_dep.get_db),
                _: bool = Depends(auth_dep.require_role("SuperAdmin"))):
    user = db.query(auth_models.User).filter(auth_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.username = user_in.username
    user.hashed_password = auth_utils.get_password_hash(user_in.password)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int,
                db: Session = Depends(auth_dep.get_db),
                _: bool = Depends(auth_dep.require_role("SuperAdmin"))):
    user = db.query(auth_models.User).filter(auth_models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return