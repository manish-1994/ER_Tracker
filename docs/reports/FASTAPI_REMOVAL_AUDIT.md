# FastAPI Removal Audit – Initial Deliverable

## Purpose
Audit the current codebase to identify every remaining dependency on the FastAPI backend before any migration work begins. No code changes are made in this step.

---

## 1. Front‑end Dependencies on FastAPI

| Search Target | Files Found | Remarks |
|---------------|-------------|---------|
| **axios imports** | `frontend/src/services/api.ts` – creates an Axios instance pointing to `API_BASE_URL` (which is set from `VITE_API_BASE_URL`). No other `.ts`/`.tsx` files import Axios directly. | This is the only place where HTTP requests could be sent to a FastAPI server. |
| **VITE_API_BASE_URL** | Used only in `frontend/src/pages/Login.tsx` for a console log (`console.log("API URL:", import.meta.env.VITE_API_BASE_URL);`). No network request is made using this variable. | No functional dependency. |
| **Hard‑coded `/api/` paths** | Search returned **0** results in all front‑end source files (`*.tsx`, `*.ts`). | No explicit calls to FastAPI routes. |
| **`http://127.0.0.1:8000` or `localhost:8000`** | Search returned **0** results. | No local FastAPI URLs used. |

### Summary
- The only potential FastAPI call path is the Axios instance defined in `api.ts`. All other front‑end code uses Supabase client services (`src/services/*`).
- The console log in `Login.tsx` does not affect functionality.

---

## 2. Remaining FastAPI Endpoints (Backend)

| File | Router Prefix / Path | Methods | Current Use in Front‑end | Classification |
|------|----------------------|---------|--------------------------|----------------|
| `backend/app/api/workbooks.py` | `/workbooks` | GET, POST, PUT, DELETE | Not used (Supabase `workbooks` table is accessed via `workbookService.ts`). | **B – Can be replaced immediately** |
| `backend/app/api/rows.py` | `/worksheets/{worksheet_id}/rows`, `/rows/{row_id}` | GET, POST, PUT, DELETE | Not used (Supabase `worksheet_rows` accessed via `rowService.ts`). | **B – Can be replaced immediately** |
| `backend/app/routers/users.py` | `/api/users` | POST, GET /{id}, PUT /{id}, DELETE /{id} | Not used (Supabase Auth handles users). | **B – Can be replaced immediately** |
| `backend/app/health/router.py` | `/health` | GET | Not used by front‑end. | **C – Still requires a lightweight endpoint (or can be removed)** |
| `backend/app/auth/permissions.py` | – (dependency) | – | Not exposed directly; used by other FastAPI routes. | **C – Backend utility, can be removed once all routes are gone** |
| `backend/app/middleware/logging.py` | – (middleware) | – | Not exposed directly. | **C – Backend utility, can be removed** |
| `backend/app/main.py` | Includes routers for upload, sheet metadata, auth, etc. | Various | Not used by front‑end (Supabase handles those features). | **C – Backend glue, can be removed after route deletion** |

---

## 3. Feature‑by‑Feature Dependency Overview

| Feature | Current Backend Dependency | Supabase Replacement | Migration Difficulty |
|---------|---------------------------|----------------------|----------------------|
| **Authentication (login, logout, session)** | FastAPI placeholder `require_auth` (not used). | Supabase Auth (`supabase.auth`). | Low – already in place. |
| **User Management** | FastAPI `/api/users`. | Supabase Auth + optional `profiles` table. | Low – replace with Supabase calls. |
| **Roles & RBAC** | FastAPI permission utilities. | Supabase `user_roles` table + RLS policies. | Low – RLS already defined. |
| **Workbooks List / Import** | FastAPI `/workbooks`. | Supabase `workbooks` table (`workbookService.ts`). | Low – replace with Supabase CRUD. |
| **Worksheets & Rows** | FastAPI `/worksheets/*` and `/rows/*`. | Supabase `worksheets` and `worksheet_rows` tables (`worksheetService.ts`, `rowService.ts`). | Low – replace with Supabase CRUD. |
| **Audit Logs** | FastAPI not used; Supabase `audit_logs` table is already used. | Supabase (`auditService.ts`). | None. |
| **Health Check** | FastAPI `/health`. | Can be served by a tiny Vercel edge function or removed. | Medium – add small serverless fn if needed. |

---

## 4. Blockers & Open Questions
- **Health endpoint**: Decide whether a simple health check is required after FastAPI removal; if so, implement as a Vercel edge function.
- **Permission middleware**: Verify that all permission checks are fully covered by Supabase Row‑Level Security (RLS) policies. If any custom logic exists, it must be re‑implemented elsewhere (e.g., client‑side guards or edge functions).
- **Axios service**: The `api.ts` file creates an Axios instance but is currently unused by the front‑end. It can be removed after confirming no remaining references.
- **Environment variable `VITE_API_BASE_URL`**: Only logged in `Login.tsx`; can be removed from the codebase and `.env` files once all FastAPI calls are eliminated.

---

## 5. Next Steps (Migration Plan)
1. **Audit complete** – No front‑end code is calling FastAPI.
2. **Phase‑by‑Phase Migration** (as requested by the user):
   - **Phase 1 – Authentication**: Ensure all login/register flows use Supabase Auth only.
   - **Phase 2 – Users & Roles**: Replace any leftover user‑service calls with Supabase; verify RLS.
   - **Phase 3 – Workbooks**: Migrate any remaining workbook‑related logic (import UI already uses Supabase). Remove the Axios service.
   - **Phase 4 – Worksheets & Rows**: Ensure row CRUD uses Supabase only.
   - **Phase 5 – Audit Logs**: Verify audit logging works via Supabase.
3. After each phase, run `npm run build --prefix frontend` and perform functional testing.
4. Once all phases pass, clean up backend code (delete FastAPI routers, `api.ts`, and related config). **Do not delete anything yet**.

---

*This document is an audit only; no code has been changed.*
