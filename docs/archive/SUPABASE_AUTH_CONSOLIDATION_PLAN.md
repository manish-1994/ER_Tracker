# SUPABASE AUTH CONSOLIDATION PLAN

## Objective
Transition the ER Tracker application from a hybrid authentication model (custom database‑stored password hashes and session tables) to a **single source of truth** using **Supabase Auth** together with Supabase Database tables. This removes duplicate user state, simplifies security, and aligns with the chosen stack (React + Supabase + Vercel).

## 1. Audit of Legacy Authentication Artifacts

| Legacy Artifact | Location(s) | Purpose | Status |
|-----------------|------------|---------|--------|
| `hashed_password` / `password_hash` | `users` table columns, various Python scripts (`create_test_user.py`, `temp_login.py`), old FastAPI routes | Stores bcrypt‑style password hash for custom auth | **Obsolete** – Supabase Auth manages password hashing. |
| `user_sessions` table | SQL migration files, `login_debug.py`, `session_restore_root_cause` reports | Tracks session tokens for custom JWT handling | **Obsolete** – Supabase issues JWTs automatically. |
| Custom auth middleware | `src/middleware/auth.py`, `decode_jwt.py`, `verify_auth.py` | Validates JWTs created by our own login endpoint | **Obsolete** – Replace with Supabase client `supabase.auth.getUser()`. |
| Manual password verification logic | `verify_password.py`, `login_debug_verbose.py` | Compares supplied password with stored hash | **Obsolete** – Use Supabase `signInWithPassword`. |

## 2. Migration Plan

### Phase 1 – Inventory & Clean‑up
1. **Identify all code paths** that read/write the legacy fields (`hashed_password`, `password_hash`, `user_sessions`). Use a global regex search across the repo:
   ```bash
   grep -R "hashed_password\|password_hash\|user_sessions" -n .
   ```
2. Remove or comment out those imports and function bodies once confirmed they are not used by any active feature.
3. Update any TypeScript/React type definitions that reference these fields.

### Phase 2 – Data Migration
1. Export current user rows (including `id`, `username`, `is_active`).
2. For each user, **create a Supabase Auth account** using the Supabase Admin SDK (run as a one‑off script on the server or a local Node script with the service‑role key).
3. Store the returned `user.id` in the existing `users` table – keep the record for profile data only.
4. Delete the `hashed_password` column from `users` after verifying all accounts were created.
5. Drop the `user_sessions` table.

### Phase 3 – Refactor Front‑end & API
* Replace calls to custom login endpoints with Supabase client `signInWithPassword`.
* Remove any direct manipulation of `user_sessions`.
* Update UI components to rely on `supabase.auth.getUser()` for current user context.
* Ensure role information (`user_roles` table) is still populated – this remains unchanged.

## 3. Database Schema Changes

| Table | Columns to Keep | Columns to Remove | Comments |
|-------|----------------|-------------------|----------|
| `users` | `id` (UUID), `username`, `is_active`, profile fields | `hashed_password`, `password_hash` | `id` will now match Supabase Auth `user.id`. |
| `roles` | `id`, `name` | – | Unchanged – used for role mapping. |
| `user_roles` | `user_id`, `role_id` | – | Unchanged – maps users to roles. |
| `user_sessions` | – | Entire table | Supabase handles JWTs automatically. |

## 4. Future User Creation Process (SuperAdmin)

### Option A – Supabase Edge Functions
1. Deploy an Edge Function that receives `{ username, password, role_ids }`.
2. Inside the function, use the **Supabase Admin SDK**:
   ```js
   const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
     email: `${username}@example.com`,
     password,
   });
   if (authErr) throw authErr;
   await supabase.from('users').insert({ id: authUser.id, username, is_active: true });
   // assign roles via `user_roles`
   ```
3. Return the created user profile to the caller.

### Option B – Vercel Serverless Function
1. Create an API route under `api/createUser.ts` in the Vercel project.
2. Use the same Supabase Admin SDK logic as the Edge Function.
3. Protect the endpoint with a **SuperAdmin API token** stored in Vercel environment variables.

Both approaches keep the secret service‑role key off the client, ensuring only privileged server‑side code can create Supabase Auth users.

## 5. Documentation Updates
* Update `README.md` with the new user‑creation workflow.
* Remove any references to custom password hashing or session tables.
* Add a section in the developer onboarding guide describing how to use the new Edge/Serverless function for SuperAdmin tasks.

---
*Generated on $(date)*
