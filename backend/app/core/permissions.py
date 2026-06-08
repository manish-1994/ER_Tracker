"""Permission constants for the RBAC system.

Each permission string is short and unique; they are stored in the
``permissions`` table and linked to roles via the ``role_permissions``
association table defined in ``backend/app/auth/models.py``.
"""

# Super Admin has all permissions – we list them explicitly for clarity
PERM_MANAGE_USERS = "manage_users"
PERM_VIEW_USERS = "view_users"
PERM_MANAGE_WORKBOOKS = "manage_workbooks"
PERM_VIEW_WORKBOOKS = "view_workbooks"
PERM_UPLOAD_WORKBOOKS = "upload_workbooks"
PERM_VIEW_DASHBOARDS = "view_dashboards"
PERM_RESET_PASSWORDS = "reset_passwords"
PERM_VIEW_STATS = "view_statistics"

ALL_PERMISSIONS = [
    PERM_MANAGE_USERS,
    PERM_VIEW_USERS,
    PERM_MANAGE_WORKBOOKS,
    PERM_VIEW_WORKBOOKS,
    PERM_UPLOAD_WORKBOOKS,
    PERM_VIEW_DASHBOARDS,
    PERM_RESET_PASSWORDS,
    PERM_VIEW_STATS,
]
