## ROLE API 404 Diagnostic Report

**Frontend request**
- `frontend/src/services/api.ts` defines `getRoles` as `api.get('/roles')`.
- The Axios instance sets `baseURL` from `API_BASE_URL` (e.g., `http://127.0.0.1:8000/api`).
- Full request URL: **GET http://127.0.0.1:8000/api/roles** (observed 404 in the browser).

**Backend route definition**
- Roles router located at `backend/app/routers/roles.py` contains:
  ```python
  @router.get("", response_model=list[dict])
  def list_roles(db: Session = Depends(get_db), _: dict = Depends(require_role("SuperAdmin"))):
      ...
  ```
- Expected to be mounted with prefix `/api`.

**Router registration**
- `backend/app/main.py` includes many routers, e.g., `app.include_router(auth_router, prefix="/api", tags=["auth"])`.
- Search results showed an `include_router` line for roles but **no import** for `roles_router`.
- Without importing the router, FastAPI never registers the endpoint, causing the 404.

**Verification**
- Swagger (`http://127.0.0.1:8000/docs`) does **not** list `GET /api/roles`.
- `curl http://127.0.0.1:8000/api/roles` returns `404 Not Found`.

**Root cause**
The roles router is defined but **not imported** in `backend/app/main.py`, so the route is missing.

**Recommended fix (not applied yet)**
1. Add import to `backend/app/main.py`:
   ```python
   from .routers.roles import router as roles_router
   ```
2. Ensure the include line matches the imported name:
   ```python
   app.include_router(roles_router, prefix="/api", tags=["roles"])
   ```
3. Restart the backend server and verify the endpoint appears in Swagger.

**Outcome**
Once the router is imported, the frontend `GET /api/roles` call will succeed, the Roles table will receive data, and the 404 error will be resolved.
