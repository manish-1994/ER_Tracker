from fastapi import APIRouter, Depends, HTTPException, status
import logging
import os
from sqlalchemy.orm import Session
from ..auth import schemas, utils, models
from ..auth.dependencies import get_db, get_current_user, require_role
from ..core.config import settings
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter()
logger = logging.getLogger("backend.app.auth.router")


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
    # SECTION 1 – BASIC LOGGING
    print("=" * 80)
    print("REAL LOGIN ENDPOINT HIT")
    print("USERNAME:", form_data.username)
    print("PROCESS ID:", os.getpid())
    # SECTION 2 – FILE AND DB INFO
    import inspect, pathlib
    cur_file = pathlib.Path(inspect.getfile(login)).resolve()
    print("LOGIN ENDPOINT FILE:", cur_file)
    print("DATABASE SESSION:", db.bind.url)
    print("=" * 80)
    logger.info("LOGIN ATTEMPT")
    logger.info(f"Username: {form_data.username}")

    # SECTION 3 – USER LOOKUP
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    print("USER:", user.username if user else None)
    print("HASH:", user.hashed_password if user else None)
    logger.info(f"User Found: {bool(user)}")
    if user:
        logger.info(f"User Active: {user.is_active}")

    # SECTION 4 – PASSWORD VERIFICATION
    password_valid = utils.verify_password(form_data.password, user.hashed_password) if user else False
    print("PASSWORD VALID:", password_valid)
    if not user or not password_valid:
        print("AUTH FAILURE")
        print("USER FOUND:", user is not None)
        logger.info("Password Verification Result: False")
        logger.info("Login Failure Reason: Incorrect credentials")
        raise HTTPException(status_code=400, detail="Incorrect username or password")

    # SUCCESS PATH
    logger.info("Password Verification Result: True")
    access_token = utils.create_access_token({"sub": user.username})
    logger.info("JWT Generated")
    logger.info("Login Success")
    return {"access_token": access_token, "token_type": "bearer"}
