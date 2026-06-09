from datetime import datetime, timedelta
from typing import Any
from jose import JWTError, jwt
from ..core.config import settings
import hashlib
# Argon2 password hashing for stronger security
from argon2 import PasswordHasher

def get_password_hash(password: str) -> str:
    """Return an Argon2 hash of the password.
    Uses argon2-cffi's PasswordHasher with default parameters.
    """
    ph = PasswordHasher()
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Validate a plain password against an Argon2 hash.
    Returns True if the password matches, False otherwise.
    """
    ph = PasswordHasher()
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token with an expiration time."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": int(expire.timestamp())})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
