from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Any
from jose import JWTError, jwt
from ..core.config import settings

# Use argon2 which has no binary dependency issues on Windows
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def get_password_hash(password: str) -> str:
    # bcrypt limit is 72 bytes; truncate to avoid ValueError during startup
    if len(password.encode('utf-8')) > 72:
        password = password.encode('utf-8')[:72].decode('utf-8', 'ignore')
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    # Store the expiration as a Unix timestamp (int) because python-jose expects a numeric value.
    to_encode.update({"exp": int(expire.timestamp())})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
