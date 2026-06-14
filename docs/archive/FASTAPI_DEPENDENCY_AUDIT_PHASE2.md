# FASTAPI Dependency Audit – Phase 2

## SECTION A – Remaining FastAPI Dependencies

| File | Line(s) | Dependency Type | Still Used? | Replacement Required? | Can Delete? | Risk Level |
|------|---------|----------------|------------|-----------------------|------------|------------|
| `frontend/src/services/api.ts` | 1‑38 | Axios API wrapper targeting FastAPI backend (uses `API_BASE_URL`, JWT interceptor) | YES (used by admin pages for user/role management) | YES – replace with Supabase client calls or remove if functionality moved | NO | Medium |
| `frontend/src/config/appConfig.ts` | 4‑5 | Export of `API_BASE_URL` (FastAPI base) and `JWT_STORAGE_KEY` | YES (imported by `api.ts`) | YES – can be removed after migrating all FastAPI calls | NO (used only by `api.ts`) | Low |
| `frontend/src/pages/RoleManagement.tsx` | N/A | Imports `api` for role CRUD | YES (role CRUD still goes through FastAPI) | YES – migrate to `services/roleService.ts` (Supabase) | NO | Medium |
| `frontend/src/pages/UserManagement.tsx` (if exists) | N/A | May use `api` for user admin | UNKNOWN – not found in current search, but project mentions user endpoints | YES if present – replace with Supabase admin functions | NO | Medium |

## SECTION B – Safe To Delete Files

| File | Reason |
|------|--------|
| `frontend/src/config/appConfig.ts` (after migration) | Only provides FastAPI URL and JWT key, both obsolete after full migration |
| `frontend/src/services/api.ts` (after migration) | Entire Axios wrapper becomes unnecessary once all endpoints are moved to Supabase |

## SECTION C – Files Requiring Migration

| File | Current Usage | Migration Hint |
|------|---------------|----------------|
| `frontend/src/pages/RoleManagement.tsx` | Uses `api` for `getRoles`, `createRole`, `updateRole`, `deleteRole` | Switch to `services/roleService.ts` which uses Supabase |
| `frontend/src/pages/UserManagement.tsx` (if present) | Uses `api` for user admin endpoints | Replace with Supabase admin functions or custom RPCs |
| Any component importing `api` for auth (now removed) | Already migrated in AuthContext and Login/Profile | No further action needed |

## SECTION D – Broken Assumptions

1. **`user_profiles` table existence** – The migration assumes a Supabase table `user_profiles` with columns `full_name`, `email`, etc. Verify schema in `SUPABASE_SCHEMA.sql`.
2. **Password change UI** – The Profile page still contains a placeholder for changing password; the mutation exists but UI is not wired.
3. **Role management still uses FastAPI** – FastAPI endpoints for role CRUD are still active; they need migration before FastAPI can be fully removed.
4. **Legacy JWT storage** – `JWT_STORAGE_KEY` is still used in `api.ts` interceptor; once `api.ts` is removed, this can be cleaned up.

## SECTION E – Final FastAPI Removal Readiness Score

| Criterion | Status | Weight |
|-----------|--------|--------|
| Auth migration completed | ✅ | 30% |
| No remaining FastAPI URL references | ❌ (still in `api.ts` and `appConfig.ts`) | 20% |
| Role management migrated | ❌ (still uses FastAPI) | 20% |
| User management migrated | ❓ (not found, assume pending) | 10% |
| All admin endpoints migrated | ❌ (partial) | 20% |

**Score:** 30% (auth) + 0% = **30%** readiness. Further work required to migrate role/user admin functionality and remove the `api` service.

---

*Generated on 2026‑06‑10.*