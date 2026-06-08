from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import joinedload
from sqlalchemy.orm import Session
from ..models.base import SessionLocal
from ..core.config import settings
from .utils import verify_password, create_access_token
from . import schemas, models
from jose import JWTError, jwt

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    """Validate the JWT and return the authenticated user.

    The token is expected to be a Bearer token supplied via the ``Authorization``
    header. ``fastapi.security`` extracts the token for us. If the token is
    missing, malformed, or fails verification, a ``401 UNAUTHORIZED`` error is
    raised.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    db = SessionLocal()
    try:
        # eager load roles to avoid DetachedInstanceError after session close
        print("LOOKING UP USER:", username)
        user = (
            db.query(models.User)
            .options(
                joinedload(models.User.roles).joinedload(models.Role.permissions)
            )
            .filter(models.User.username == username)
            .first()
        )
        if user:
            print("USER FOUND:", user.username)
        else:
            print("USER NOT FOUND for username", username)
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return user
    finally:
        db.close()

def require_role(role_name: str):
    """Dependency that ensures the current user has a specific role.

    Returns ``True`` if the user possesses the role, otherwise raises a 403.
    """

    def checker(user=Depends(get_current_user)):
        for role in getattr(user, "roles", []):
            if role.name == role_name:
                return True
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges")

    return checker

# Alias for compatibility with routers expecting ``get_current_active_user``
def get_current_active_user(token: str = Depends(oauth2_scheme)):
    """Return the authenticated user; kept for backward compatibility.

    Some routers import ``get_current_active_user``. Historically it performed the
    same logic as ``get_current_user`` (ensuring the token is valid and loading the
    user with eager roles/permissions). We simply delegate to ``get_current_user``.
    """
    return get_current_user(token)


def require_permission(permission_name: str):
    """Dependency that ensures the current user has a specific permission.

    It loads the user's roles and their permissions (eagerly via the existing
    ``get_current_user`` dependency) and checks whether any role grants the
    requested permission. If not, a ``403 Forbidden`` response is raised.
    """

    def checker(user=Depends(get_current_user)):
        # ``user.roles`` is already loaded with permissions in ``get_current_user``
        for role in getattr(user, "roles", []):
            for perm in getattr(role, "permissions", []):
                if perm.name == permission_name:
                    return True
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient privileges")

    return checker
