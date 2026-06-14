# Permission Enforcement Audit

This document audits the FastAPI backend for missing permission checks on business endpoints.

## Audit Table

| METHOD | ROUTE | AUTH | ROLE | PERMISSION | RISK LEVEL |
|--------|-------|------|------|------------|------------|
| GET | /health | ✅ (public) | – | – | Low |
| GET | /api/health | ✅ (public) | – | – | Low |
| GET | /users/me | ✅ (Depends on `get_current_user`) | – | – | Medium |
| GET | /users | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| GET | /users/{user_id} | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| PUT | /users/{user_id} | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| DELETE | /users/{user_id} | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| POST | /auth/register | ✅ (no role required) | – | – | Medium |
| POST | /auth/login | ✅ (no role required) | – | – | Medium |
| GET | /api/users | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| GET | /api/users/{user_id} | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| POST | /api/users | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| PUT | /api/users/{user_id} | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| PUT | /api/users/{user_id}/activate | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| PUT | /api/users/{user_id}/deactivate | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| DELETE | /api/users/{user_id} | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| GET | /api/roles | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| POST | /api/roles | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| PUT | /api/roles/{role_id} | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| DELETE | /api/roles/{role_id} | ✅ (Depends on `get_current_user`) | SuperAdmin (via `require_role`) | – | High |
| GET | /profile | ✅ (Depends on `get_current_active_user`) | – | – | Medium |
| PUT | /profile | ✅ (Depends on `get_current_active_user`) | – | – | Medium |
| PUT | /profile/password | ✅ (Depends on `get_current_active_user`) | – | – | Medium |
| GET | /api/workbooks | ✅ (Depends on `get_current_user`) | – | view_workbooks | Medium |
| GET | /api/workbooks/{workbook_id} | ✅ (Depends on `get_current_user`) | – | view_workbooks | Medium |
| DELETE | /api/workbooks/{workbook_id} | ✅ (Depends on `get_current_user`) | – | manage_workbooks | High |
| GET | /api/workbooks/{workbook_id}/worksheets | ✅ (Depends on `get_current_user`) | – | view_workbooks | Medium |
| GET | /api/worksheets | ✅ (Depends on `get_current_user`) | – | view_workbooks | Medium |
| GET | /api/worksheets/{sheet_id} | ✅ (Depends on `get_current_user`) | – | view_workbooks | Medium |
| POST | /api/upload | ✅ (Depends on `get_current_user`) | – | upload_workbooks | High |

## Observations

* **Authentication** is enforced on all endpoints (via `Depends(get_current_user)` or similar).  
* **Role enforcement** (`require_role("SuperAdmin")`) is correctly applied to admin‑level resources such as users and roles.  
* **Permission enforcement** is **absent** on most business‑logic routes (workbooks, worksheets, upload). They rely only on authentication, which means any authenticated user can perform actions they may not be authorized for.

## Recommended Permission Mappings

| Permission | Scope |
|------------|-------|
| `upload_workbooks` | POST `/api/upload` – only users allowed to upload new workbooks. |
| `view_workbooks`   | GET `/api/workbooks*` and GET `/api/worksheets*` – read‑only access to workbooks and worksheets. |
| `manage_workbooks` | DELETE `/api/workbooks/{id}` – delete or permanently modify workbooks. |
| `manage_users`     | All `/api/users*` endpoints – create, read, update, delete users. |
| `manage_roles`     | All `/api/roles*` endpoints – create, read, update, delete roles. |
| `view_dashboards`  | Future dashboard endpoints (not currently present). |
| `view_stats`       | Future analytics/statistics endpoints. |

## Suggested Enforcement Strategy
1. **Create a dependency** (e.g., `require_permission(permission_name: str)`) that checks the current user’s permissions from the RBAC tables.
2. **Add the dependency** to each endpoint that should be limited:
   * `GET /api/workbooks*` → `require_permission("view_workbooks")`
   * `DELETE /api/workbooks/{id}` → `require_permission("manage_workbooks")`
   * `POST /api/upload` → `require_permission("upload_workbooks")`
   * Future analytics routes → `require_permission("view_stats")` etc.
3. **Maintain role shortcuts** (e.g., `SuperAdmin` bypasses permission checks) while keeping explicit permission checks for finer‑grained control.
4. **Populate the `permissions` table** with the above permissions and assign them to appropriate roles.

## Conclusion
The audit shows that while authentication is correctly applied, **permission checks are missing on core business endpoints**. Implementing the suggested permission dependencies will close this security gap and provide a robust RBAC model without altering existing business logic.
