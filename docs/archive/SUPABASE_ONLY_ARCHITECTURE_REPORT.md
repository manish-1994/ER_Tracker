# Supabase‑Only Architecture Report

## Overview
The **ER Tracker** project has been migrated to a pure **Supabase** architecture. All server‑side functionality that previously relied on a FastAPI backend has been removed. The application now consists of:

| Layer | Technology |
|-------|------------|
| Frontend | **React** (Vite, TypeScript) |
| Auth | **Supabase Auth** |
| Database | **Supabase** – tables `users`, `roles`, `permissions`, `user_roles`, `role_permissions` |
| Hosting | **Vercel** |

## Key Changes
1. **Backend removal** – the entire `backend/` directory and all FastAPI routers (`app/routers/*.py`) were deleted.
2. **Service layer refactor** – `frontend/src/services/userService.ts` and `roleService.ts` now interact directly with Supabase via the Supabase client. No REST calls or `API_BASE` environment variables are used.
3. **User Management** – CRUD operations, password hashing, activation/deactivation, and role assignment are performed using Supabase Auth and the Supabase tables.
4. **Role Management** – Roles, permissions, and role‑assignments are fetched and mutated through Supabase tables (`roles`, `permissions`, `role_permissions`, `user_roles`). All workbook‑specific logic has been removed.
5. **UI updates** – Components (`UserManagement`, `RoleManagement`, etc.) now consume the refactored services and display data from Supabase.
6. **Configuration** – `.env` files only contain Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). No FastAPI URLs remain.

## Verification
* `npm install` and `npm run build` complete without errors (only non‑blocking CSS warnings).
* Manual testing confirms that users can be created, edited, activated/deactivated, and assigned roles.
* The Roles summary card correctly shows the total number of role definitions (rows in the `roles` table) and user counts per role.

## Deployment
The project is ready to be deployed to **Vercel**. The Vercel build command is `npm run build` and the output directory is `dist/`.

---
*Report generated on 2026‑06‑11.*
