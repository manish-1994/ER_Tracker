# DATABASE AUTH ARCHITECTURE

## Overview
The project now uses a **custom, database‑only authentication** system that stores usernames and password hashes directly in PostgreSQL. Supabase Auth is no longer used for user login; instead the application authenticates against the `public.users` table and manages sessions via `public.user_sessions`.

## Tables

### `public.users`
| Column        | Type    | Constraints                                         |
|---------------|---------|----------------------------------------------------|
| `id`          | `uuid`  | Primary key, default `uuid_generate_v4()`          |
| `username`    | `text`  | Unique, not null                                   |
| `password_hash`| `text` | Not null – stores bcrypt hash via PostgreSQL `crypt` |
| `role`        | `text`  | Not null, check constraint (`viewer`,`editor`,`owner`,`superadmin`) |
| `status`      | `text`  | Default `'active'`                                 |
| `created_at`  | `timestamp` | Default `now()`                                 |

### `public.user_sessions`
| Column        | Type    | Constraints                                         |
|---------------|---------|----------------------------------------------------|
| `id`          | `uuid`  | Primary key, default `uuid_generate_v4()`          |
| `user_id`     | `uuid`  | FK → `users(id)`, on delete cascade                |
| `session_token`| `uuid` | Unique, not null                                   |
| `expires_at`  | `timestamp` | Not null                                      |
| `created_at`  | `timestamp` | Default `now()`                                |

## Authentication Flow
1. **Login** – User provides `username` and `password`.
   - Query `users` for the supplied username.
   - Verify password with PostgreSQL `crypt` (`password_hash = crypt(provided, password_hash)`).
   - On success, generate a new `session_token` (`uuid_generate_v4()`), insert a row in `user_sessions` with an expiry (e.g., now() + 7 days).
   - Return the token to the client (stored in HttpOnly cookie or local storage).
2. **Session Restore** – On each request, the client sends the `session_token`.
   - Look up the token in `user_sessions`; ensure `expires_at` is in the future.
   - Retrieve associated `user_id` and role for RBAC checks.
3. **Logout** – Delete the corresponding `user_sessions` row.
4. **Password Change** – Update `password_hash` using `crypt(newPassword, gen_salt('bf'))`.

## Role‑Based Access Control (RBAC)
Roles are stored directly on the `users` row. Application code checks the role after session restoration to gate UI components and API endpoints.

## Audit Logging
All authentication actions (login, logout, failed attempts, password changes) should be recorded in the existing `audit_logs` table with `action` values such as `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `PASSWORD_CHANGE`.

## Security Considerations
* Passwords are never stored in plain text – bcrypt via PostgreSQL `crypt`.
* Session tokens are UUIDs, unpredictable, and stored with an expiry.
* RLS policies can be added to restrict access to `users` and `user_sessions` to the owning user or superadmin.

## Migration Path
1. Run `DATABASE_AUTH_MIGRATION.sql` to create the tables.
2. Migrate existing Supabase Auth users (if any) by creating corresponding `users` rows and generating a deterministic password hash (or require password reset).
3. Update frontend auth code to call the new login endpoint.

---

*Generated on 2026‑06‑10.*
