# ROLE_SYSTEM_AUDIT.md

## 1. Role‑related source files
The following backend files define or use RBAC constructs (searches for `role`, `roles`, `permission`, `permissions`, `user_roles`, `role_permissions`):

- `backend/app/auth/models.py` – SQLAlchemy models for `User`, `Role`, `Permission` and the association tables `user_roles` and `role_permissions`.
- `backend/app/auth/dependencies.py` – Dependency helpers `require_role` and `require_permission` that enforce role/permission checks on FastAPI routes.
- `backend/app/auth/router.py` – Authentication routes that use the above dependencies.
- `backend/app/routers/roles.py` – CRUD endpoints for roles (list, create, update, delete) protected by `require_role("SuperAdmin")`.
- `backend/app/routers/users.py` – User‑management endpoints that also depend on `require_role("SuperAdmin")`.
- `backend/app/routers/profile.py` – Returns the current user’s profile together with their roles and permissions.
- `backend/app/core/permissions.py` – Central list of permission constants (e.g. `PERM_MANAGE_USERS`).
- `backend/app/core/seed.py` – Seed script that creates the default roles (`SuperAdmin`, `Admin`, `Manager`, `Analyst`, `Viewer`) and assigns permissions.
- `backend/scripts/create_supabase_schema.py`, `backend/scripts/verify_supabase_schema.py`, `backend/scripts/verify_import.py`, `backend/scripts/verify_cutover.py` – Scripts that reference the role‑related tables during migration/verification.
- `backend/tmp/role_audit.py` – Utility script (added for this audit) that prints schema information and row counts for the RBAC tables.

## 2. Backend endpoints related to roles

| URL | HTTP Method | Request schema | Response schema | Notes |
|-----|-------------|----------------|----------------|-------|
| `/api/roles` | **GET** | – | `list[dict]` (each role with `id`, `name`, `description`, `permissions` list) | Lists all roles – requires `SuperAdmin` role. |
| `/api/roles` | **POST** | `name: str`, `description: str = ""`, `permission_ids: list[int] = []` | `{'id': int, 'name': str}` | Creates a new role – requires `SuperAdmin`. |
| `/api/roles/{role_id}` | **PUT** | `name?: str`, `description?: str`, `permission_ids?: list[int]` | – (no body) | Updates role attributes and/or its permissions – requires `SuperAdmin`. |
| `/api/roles/{role_id}` | **DELETE** | – | – | Deletes a role – requires `SuperAdmin`. |
| `/api/users` | **GET** | – | `list[dict]` (users with `id`, `username`, `is_active`, `roles` list) | Returns all users – requires `SuperAdmin`. |
| `/api/users/{user_id}` | **GET** | – | `dict` (single user with role list) | Requires `SuperAdmin`. |
| `/api/users/{user_id}` (POST/PUT) | **PUT** | `username?`, `password?`, `is_active?`, `role_ids?` | – | Create or update a user – requires `SuperAdmin`. |
| `/api/users/{user_id}/activate` | **PUT** | – | – | Activate a user – requires `SuperAdmin`. |
| `/api/users/{user_id}/deactivate` | **PUT** | – | – | Deactivate a user – requires `SuperAdmin`. |
| `/api/users/{user_id}` | **DELETE** | – | – | Delete a user – requires `SuperAdmin`. |
| `/api/profile` | **GET** | – | `{ email, full_name, roles: [{id, name}], permissions: [{id, name}] }` | Returns the logged‑in user’s profile, including their roles and permissions. |
| `/api/profile` | **PUT** | Fields to update (`full_name`, `email`, etc.) | – | Updates mutable profile fields – requires an authenticated user (no role restriction). |

All role‑related endpoints are protected by the `require_role("SuperAdmin")` dependency, meaning only users with the **SuperAdmin** role can invoke them.

## 3. Front‑end role pages/components
The current frontend (`frontend/src/…`) contains **no dedicated role‑management UI**. The only place roles appear is in the **Profile** page, which displays the logged‑in user’s roles and permissions fetched from `/api/profile`. No API calls for creating, editing or deleting roles are present in the frontend code.

## 4. Database tables (RBAC)
```
--- roles ---
Columns: ['id', 'name', 'description']
Primary Keys: ['id']
Foreign Keys: []
Row count: 5

--- permissions ---
Columns: ['id', 'name', 'description']
Primary Keys: ['id']
Foreign Keys: []
Row count: 8

--- user_roles ---
Columns: ['user_id', 'role_id']
Primary Keys: ['user_id', 'role_id']
Foreign Keys: [('user_id', 'users', 'id'), ('role_id', 'roles', 'id')]
Row count: 2

--- role_permissions ---
Columns: ['role_id', 'permission_id']
Primary Keys: ['role_id', 'permission_id']
Foreign Keys: [('role_id', 'roles', 'id'), ('permission_id', 'permissions', 'id')]
Row count: 20
```
*The row counts reflect the current Supabase data after the migration.*

## 5. Existing role records
| id | name        | description |
|----|-------------|-------------|
| 1  | SuperAdmin  | Super administrator with full access |
| 2  | Admin       | Administrative user with elevated privileges |
| 3  | Manager     | Can view dashboards and upload workbooks |
| 4  | Analyst     | Can view assigned workbooks and worksheets |
| 5  | Viewer      | Read‑only access |

## 6. Existing permission records
| id | name               | description |
|----|--------------------|-------------|
| 1  | manage_users       | Create, edit, delete users and assign roles |
| 2  | view_users         | View user list and details |
| 3  | view_dashboards    | View dashboard overview |
| 4  | upload_workbooks   | Upload new workbooks |
| 5  | view_workbooks     | View workbooks the user has access to |
| 6  | view_stats         | View statistical reports |
| 7  | manage_roles       | Create, edit, delete roles and assign permissions |
| 8  | manage_permissions | Manage permission definitions |

## 7. Role → permission mappings (selected examples)
- **SuperAdmin** – *all* permissions (the seed script assigns `ALL_PERMISSIONS`).
- **Admin** – `manage_users`, `view_users`, `view_dashboards`, `view_stats`.
- **Manager** – `view_dashboards`, `upload_workbooks`, `view_workbooks`.
- **Analyst** – `view_workbooks`, `view_dashboards`.
- **Viewer** – `view_workbooks` only.
(Exact mappings can be queried via the `role_permissions` table; row count is 20.)

## 8. Supported RBAC operations (based on current code)
| Operation | Supported? | Where enforced |
|-----------|------------|----------------|
| Create Role | ✅ (POST `/api/roles`) | Backend – requires `SuperAdmin` role |
| Edit Role   | ✅ (PUT `/api/roles/{role_id}`) | Backend – requires `SuperAdmin` |
| Delete Role | ✅ (DELETE `/api/roles/{role_id}`) | Backend – requires `SuperAdmin` |
| Assign Permissions to a Role | ✅ (via `permission_ids` in create/update role) |
| Remove Permissions from a Role | ✅ (update with a reduced list) |
| Assign Roles to Users | ✅ (POST/PUT `/api/users` with `role_ids`) |
| Multiple Roles per User | ✅ (association table `user_roles` allows many‑to‑many) |

## 9. Enforcement of RBAC
The code uses the following patterns to enforce access control:
- **`require_role(role_name: str)`** – FastAPI dependency that raises `HTTPException(403)` if the current authenticated user does not possess the specified role.
- **`require_permission(permission_name: str)`** – Similar dependency that checks the user’s aggregated permissions (via eager‑loaded `User.roles → Role.permissions`).
- **`get_current_user`** – Dependency that authenticates the JWT and loads the user with eager‑loaded roles and permissions.
- All role‑management and user‑management endpoints depend on `require_role("SuperAdmin")`, so only SuperAdmin users can modify RBAC data.
- Regular business‑logic endpoints (e.g., workbook upload, view) **do not** currently check roles/permissions; they only require a valid authenticated user (`get_current_user`).

## 10. Summary & Recommendations
- **RBAC implementation is present and functional** for managing roles, permissions, and user‑role assignments.
- **Enforcement is limited** to the admin‑level endpoints. Core application features (workbook upload, view, etc.) do **not** yet check permissions, meaning any authenticated user can perform those actions.
- **Recommended next steps**:
  1. Identify which business operations need restriction (e.g., only `Manager` or higher can upload workbooks). Add the appropriate `require_role` or `require_permission` dependency to those router functions.
  2. Extend the frontend UI to expose role management for SuperAdmin users (create/edit/delete roles, assign permissions, assign roles to users).
  3. Write integration tests that verify permission checks on protected endpoints.
  4. Document the permission matrix for future developers.

---
*Generated automatically as part of the ROLE_SYSTEM_AUDIT.*
