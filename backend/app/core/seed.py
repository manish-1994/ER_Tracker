"""Database seed routine for RBAC.

This module is imported during application startup (see ``backend/app/main.py``).
It ensures that the required roles, permissions and the default SuperAdmin user
exist. All operations are idempotent – they check for existing records before
inserting, so running the seed on subsequent starts does not duplicate data or
affect existing users/workbooks.
"""

from sqlalchemy.orm import Session

from ..auth.models import Role, Permission, User
from ..auth.utils import get_password_hash
from .permissions import (
    PERM_MANAGE_USERS,
    PERM_VIEW_USERS,
    PERM_MANAGE_WORKBOOKS,
    PERM_VIEW_WORKBOOKS,
    PERM_UPLOAD_WORKBOOKS,
    PERM_VIEW_DASHBOARDS,
    PERM_RESET_PASSWORDS,
    PERM_VIEW_STATS,
    ALL_PERMISSIONS,
)


def _get_or_create_role(session: Session, name: str, description: str) -> Role:
    role = session.query(Role).filter(Role.name == name).first()
    if not role:
        role = Role(name=name, description=description)
        session.add(role)
        session.commit()
        session.refresh(role)
    return role


def _get_or_create_permission(session: Session, name: str, description: str) -> Permission:
    perm = session.query(Permission).filter(Permission.name == name).first()
    if not perm:
        perm = Permission(name=name, description=description)
        session.add(perm)
        session.commit()
        session.refresh(perm)
    return perm


def initialize(db_session: Session) -> None:
    """Create all RBAC entities if they do not exist.

    This function is called from ``backend/app/main.py`` during the FastAPI
    startup event. ``db_session`` should be a fresh ``SessionLocal`` instance.
    """
    # --- Roles -------------------------------------------------------------
    superadmin_role = _get_or_create_role(db_session, "SuperAdmin", "Super administrator with full access")
    admin_role = _get_or_create_role(db_session, "Admin", "Administrative user with elevated privileges")
    manager_role = _get_or_create_role(db_session, "Manager", "Can view dashboards and upload workbooks")
    analyst_role = _get_or_create_role(db_session, "Analyst", "Can view assigned workbooks and worksheets")
    viewer_role = _get_or_create_role(db_session, "Viewer", "Read‑only access")

    # --- Permissions -------------------------------------------------------
    perm_map = {
        PERM_MANAGE_USERS: "Create, edit, delete users and assign roles",
        PERM_VIEW_USERS: "View user list and details",
        PERM_MANAGE_WORKBOOKS: "Create, edit, delete workbooks",
        PERM_VIEW_WORKBOOKS: "Read workbooks and worksheets",
        PERM_UPLOAD_WORKBOOKS: "Upload new workbooks",
        PERM_VIEW_DASHBOARDS: "Access dashboard views",
        PERM_RESET_PASSWORDS: "Reset user passwords",
        PERM_VIEW_STATS: "View system statistics",
    }
    permission_objects = {}
    for name, desc in perm_map.items():
        permission_objects[name] = _get_or_create_permission(db_session, name, desc)

    # --- Assign permissions to roles ---------------------------------------
    # Helper to clear and set permissions for a role
    def set_role_perms(role: Role, perms: list[str]):
        role.permissions = [permission_objects[p] for p in perms]
        db_session.add(role)
        db_session.commit()

    set_role_perms(
        superadmin_role,
        ALL_PERMISSIONS,
    )
    set_role_perms(
        admin_role,
        [
            PERM_MANAGE_USERS,
            PERM_VIEW_USERS,
            PERM_MANAGE_WORKBOOKS,
            PERM_VIEW_WORKBOOKS,
            PERM_UPLOAD_WORKBOOKS,
            PERM_VIEW_DASHBOARDS,
        ],
    )
    set_role_perms(
        manager_role,
        [PERM_VIEW_DASHBOARDS, PERM_UPLOAD_WORKBOOKS, PERM_VIEW_WORKBOOKS],
    )
    set_role_perms(
        analyst_role,
        [PERM_VIEW_WORKBOOKS, PERM_VIEW_DASHBOARDS],
    )
    set_role_perms(
        viewer_role,
        [PERM_VIEW_WORKBOOKS],
    )

    # --- SuperAdmin user ---------------------------------------------------
    superadmin_user = db_session.query(User).filter(User.username == "superadmin").first()
    if not superadmin_user:
        superadmin_user = User(
            username="superadmin",
            hashed_password=get_password_hash("SuperAdmin@123"),
            is_active=True,
        )
        db_session.add(superadmin_user)
        db_session.commit()
        db_session.refresh(superadmin_user)
    # Ensure the user has the SuperAdmin role
    if superadmin_role not in superadmin_user.roles:
        superadmin_user.roles.append(superadmin_role)
        db_session.add(superadmin_user)
        db_session.commit()
