# Authentication Architecture Reconciliation Report

## 1. Schema Audit – `users` Table
The project contains two distinct user‑related tables:

1. **`auth.users`** – Supabase‑managed authentication table (created automatically by Supabase). It stores the fields `id`, `email`, `hashed_password`, etc.
2. **`public.users`** – A custom table defined in legacy migrations (not present in the current `SUPABASE_SCHEMA.sql`). Earlier versions of the app stored a `hashed_password` column here for a custom login flow.

The current `SUPABASE_SCHEMA.sql` (shown above) **does not define a `public.users` table** – only the `auth.users` table is referenced (e.g., `owner_id uuid not null references auth.users(id)`). This indicates the legacy `users` table with `hashed_password` has been dropped from the schema, but the column still appears in the database because the migration history retained it.

### Columns & Constraints (legacy `public.users`)
| Column          | Type | Constraints |
|-----------------|------|-------------|
| id              | uuid | primary key |
| username        | text | not null |
| hashed_password | text | not null |
| is_active       | boolean | default true |

The **`hashed_password`** column is defined as `NOT NULL`. When the frontend now creates a user only in the `users` table (as revised in the previous step) without providing a value for `hashed_password`, the database throws:

```
23502 null value in column "hashed_password" of relation "users" violates not‑null constraint
```

## 2. Authentication Architecture Audit

### Option A – Legacy Custom Auth
* Stores usernames and password hashes in `public.users`.
* Application performed manual password verification (e.g., using Argon2/bcrypt) – no evidence of such code in the current repo.

### Option B – Supabase Auth (Preferred)
* Uses `supabase.auth.signInWithPassword()` for login.
* User records are stored in `auth.users` (managed by Supabase). The app‑specific `users` table is meant only for additional profile data and RBAC mappings.

The codebase now imports `supabase.auth` and calls `signInWithPassword`, indicating a migration to **Option B**.

## 3. Duplication Check
Searches for `hashed_password`, `argon2`, `bcrypt`, and custom password verification returned **no results** in the entire `frontend/` source tree. The only remaining reference to a password column is the `hashed_password` column in the (now‑orphaned) `public.users` table.

## 4. Recommended Target Architecture
* Adopt **Supabase Auth only** – all authentication should rely on `auth.users`.
* Remove the legacy `public.users` table or drop the `hashed_password` column and any NOT NULL constraint.
* Keep a lightweight `public.users` (or rename it `profiles`) that stores only non‑auth fields such as `username`, `is_active`, and profile information.
* Update any remaining insert statements to omit `hashed_password` and let Supabase generate the Auth record.

## 5. User Creation Strategy
### Current Frontend Flow (post‑refactor)
1. Insert a row into `public.users` (now without `hashed_password`).
2. Assign roles via `user_roles`.
3. **Missing**: Creation of the corresponding Supabase Auth user – results in the 403 error previously seen.

### Desired Flow (Supabase Auth)
1. Call a **backend Edge Function / serverless endpoint** that uses a service‑role key to:
   * Create the Auth user via `supabase.auth.admin.createUser`.
   * Insert a profile row into `public.users` (or `profiles`).
   * Assign roles.
2. Frontend only calls this endpoint; the Auth user is then available for login.

### Future Edge Function Flow
```ts
// edge function (Node/TS)
const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
});
await supabaseAdmin.from('users').insert({ id: authUser.id, username, is_active: true });
await supabaseAdmin.from('user_roles').insert({ user_id: authUser.id, role_id });
```

## 6. Next Steps (No code changes yet)
1. **Schema Migration** – drop `hashed_password` column or the entire legacy `users` table.
2. Add a migration that creates a new `profiles` table (if needed) referencing `auth.users(id)`.
3. Implement the Edge Function / serverless endpoint for user creation.
4. Update UI to call the new endpoint and display a warning that the Auth account will be provisioned.

---
*Report generated to document the current state, conflicts, and recommended migration path.*