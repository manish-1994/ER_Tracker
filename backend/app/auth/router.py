from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..auth import schemas, utils, models
from ..auth.dependencies import get_db, get_current_user, require_role
from ..core.config import settings
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()


@router.post("/auth/register", response_model=schemas.UserSchema)
def register(user_in: schemas.UserCreateSchema, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user_in.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed = utils.get_password_hash(user_in.password)
    user = models.User(username=user_in.username, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = utils.create_access_token({"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
