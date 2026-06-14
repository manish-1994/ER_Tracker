# Architecture Consistency Audit

## 1. Frontend Audit

### `frontend/src/services/userService.ts`
* **Uses FastAPI** – all CRUD functions (`createUser`, `getUsers`, `updateUser`, `activateUser`, `deactivateUser`) build a request URL using the constant `API_BASE` (currently an empty string, meaning relative to the same origin). They call the FastAPI endpoints under `/api/users`.
* **Does not use Supabase** – there are no `supabase` client calls in this file.

### `frontend/src/services/roleService.ts`
* Exposes two different data sources:
  * `fetchRoles` – **FastAPI** call to `${API_BASE}/roles` to retrieve role definitions (`id`, `name`, `description`).
  * `getRoles` (renamed to `getUserRoles` in the UI) – **Supabase** client call to the `user_roles` table, returning system‑wide role assignments.
* Therefore this service uses **both** FastAPI and Supabase.

### `frontend/src/services/authContext.tsx`
* Authentication is performed via **Supabase** (`supabase.auth`). No FastAPI calls are used for login or token handling.

### `frontend/src/pages/UserManagement.tsx`
* Consumes the **userService** functions – thus relies on **FastAPI** for user CRUD.
* Also imports `getRoles` from `roleService` (which now points to the FastAPI `fetchRoles` for role definitions) and uses it to populate role pickers.

### `frontend/src/pages/RoleManagement.tsx`
* Uses `fetchRoles` (FastAPI) for role definitions and `getUserRoles` (Supabase) to compute user counts.
* No direct FastAPI calls other than through `fetchRoles`.

## 2. Backend Audit

### `backend/app/routers/users.py`
* Provides the full set of user CRUD endpoints required by the frontend (`GET /api/users`, `POST /api/users`, `PUT /api/users/{id}`, `PUT /api/users/{id}/activate`, `PUT /api/users/{id}/deactivate`).
* Implements password hashing, role assignment via the `user.roles` relationship (which maps to the `user_roles` join table), and status toggling.

### `backend/app/routers/roles.py`
* Exposes role management endpoints (`GET /roles`, `POST /roles`, `PUT /roles/{id}`, `DELETE /roles/{id}`) that operate on the `roles` and `role_permissions` tables.
* No workbook‑specific logic remains.

Both routers are active and imported in `backend/app/main.py`, so the FastAPI service is fully functional.

## 3. Network Audit (active API calls)

### Supabase Calls
* `supabase.from("user_roles").select("*")` – used in `roleService.getRoles` (renamed `getUserRoles`).
* `supabase.from("user_roles").insert(...)`, `update(...)`, `delete(...)` – role assignment helpers.
* Authentication calls (`supabase.auth`) – performed in `authContext` and other auth‑related components.

### FastAPI Calls
* All user CRUD URLs (`/api/users`, `/api/users/{id}`, `/api/users/{id}/activate`, `/api/users/{id}/deactivate`).
* Role definition URL (`/roles`) accessed via `fetchRoles`.
* No other FastAPI endpoints are referenced from the frontend.

## 4. Architecture Map (Current)

```
+-------------------+        +-------------------+        +--------------------+
|  Frontend (React) |<----->|  FastAPI Backend  |<----->|  PostgreSQL (Supabase) |
+-------------------+        +-------------------+        +--------------------+
        ^                         ^                         ^
        |                         |                         |
        |                         |                         |
        |   Supabase client (auth,|                         |
        |   user_roles table)    |   Direct DB tables:     |
        |                         |   users, roles, perms, |
        |                         |   user_roles, role_perms|
        +-------------------------+-------------------------+
```

* **Login / Authorization** – Supabase Auth.
* **Users** – Managed via FastAPI endpoints, which in turn manipulate the `users` table and related `user_roles`.
* **Roles & Permissions** – Role definitions come from FastAPI (`/roles`). Assignments (`user_roles`) are read/written via Supabase for counting purposes.
* **Workbooks** – Remain in Supabase schema but are not referenced by the current role management UI.

## 5. Recommendation

### Choose a single architecture moving forward:
* **Option A – Supabase‑only**
  * Pros: Simpler stack, fewer moving parts, native RLS policies, no separate backend server.
  * Cons: Requires re‑implementing the user CRUD logic that currently lives in FastAPI (password hashing, role assignment, etc.).
* **Option B – FastAPI + Database (current state)**
  * Pros: All business logic (user creation, password hashing, role assignment) is already implemented and tested in FastAPI. The frontend already consumes these endpoints.
  * Cons: Maintains two separate services (FastAPI and Supabase) and duplicate API base configuration.

**Current implementation** is a **hybrid**: authentication & `user_roles` reads use Supabase, while user CRUD and role definition management use FastAPI.

**Recommendation:** Continue with **Option B (FastAPI + Database)** until all legacy FastAPI functionality is fully migrated or removed. This avoids rewriting security‑critical user management code and leverages the existing, audited FastAPI endpoints.

## 6. Conclusion
* The project presently runs a hybrid architecture.
* No remaining workbook‑specific FastAPI references exist – those have been removed.
* All required features are operational under the current hybrid setup.
* For consistency and maintainability, adopt the FastAPI + Database architecture as the single source of truth while keeping Supabase for authentication and simple role‑assignment queries.

---
*Report generated on 2026‑06‑11.*
