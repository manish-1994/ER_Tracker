# DATABASE AUTH ARCHITECTURE MASTER REPORT

## 1. Full Schema Inventory
| Table | Schema | Columns (type & constraints) | Primary Key | Foreign Keys | Indexes | Approx. Row Count |
|-------|--------|------------------------------|-------------|--------------|---------|-------------------|
| **public.users** | public | `id` uuid PK default gen_random_uuid() <br> `username` text NOT NULL UNIQUE <br> `password_hash` text NOT NULL (bcrypt via `crypt`) <br> `role` text NOT NULL CHECK (role IN ('viewer','editor','owner','superadmin')) <br> `status` text NOT NULL DEFAULT 'active' <br> `created_at` timestamp NOT NULL DEFAULT now() | `id` | – | Unique index on `username` | Not available – run `SELECT COUNT(*) FROM public.users;` |
| **public.user_sessions** | public | `id` uuid PK default gen_random_uuid() <br> `user_id` uuid NOT NULL <br> `session_token` uuid NOT NULL UNIQUE <br> `expires_at` timestamp NOT NULL <br> `created_at` timestamp NOT NULL DEFAULT now() | `id` | `user_id` → `public.users(id)` (ON DELETE CASCADE) | Unique index on `session_token` | – |
| **public.user_roles** | public | `id` uuid PK default gen_random_uuid() <br> `user_id` uuid NOT NULL <br> `workbook_id` uuid NOT NULL <br> `role` text NOT NULL CHECK (role IN ('owner','editor','viewer')) <br> `created_at` timestamp NOT NULL DEFAULT now() | `id` | `user_id` → `public.users(id)` (ON DELETE CASCADE) <br> `workbook_id` → `public.workbooks(id)` (ON DELETE CASCADE) | Indexes on `user_id` and `workbook_id` (see `SUPABASE_SCHEMA.sql` lines 68‑69) | – |
| **public.workbooks** | public | `id` uuid PK default gen_random_uuid() <br> `name` text NOT NULL <br> `owner_id` uuid NOT NULL <br> `created_at` timestamptz NOT NULL DEFAULT now() <br> `updated_at` timestamptz NOT NULL DEFAULT now() <br> `deleted_at` timestamptz | `id` | `owner_id` → `auth.users(id)` (legacy) | – | – |
| **public.worksheets** | public | `id` uuid PK default gen_random_uuid() <br> `workbook_id` uuid NOT NULL <br> `title` text NOT NULL <br> `position` integer NOT NULL DEFAULT 0 <br> `created_at` timestamptz NOT NULL DEFAULT now() <br> `updated_at` timestamptz NOT NULL DEFAULT now() | `id` | `workbook_id` → `public.workbooks(id)` (ON DELETE CASCADE) | – | – |
| **public.column_metadata** | public | `id` uuid PK default gen_random_uuid() <br> `worksheet_id` uuid NOT NULL <br> `name` text NOT NULL <br> `display_name` text NOT NULL <br> `data_type` text NOT NULL <br> `order` integer NOT NULL DEFAULT 0 <br> `created_at` timestamptz NOT NULL DEFAULT now() <br> `updated_at` timestamptz NOT NULL DEFAULT now() | `id` | `worksheet_id` → `public.worksheets(id)` (ON DELETE CASCADE) | – | – |
| **public.worksheet_rows** | public | `id` uuid PK default gen_random_uuid() <br> `worksheet_id` uuid NOT NULL <br> `data` jsonb NOT NULL <br> `created_at` timestamptz NOT NULL DEFAULT now() <br> `updated_at` timestamptz NOT NULL DEFAULT now() | `id` | `worksheet_id` → `public.worksheets(id)` (ON DELETE CASCADE) | – | – |
| **public.audit_logs** | public | `id` uuid PK default gen_random_uuid() <br> `user_id` uuid NOT NULL <br> `action` text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')) <br> `table_name` text NOT NULL <br> `record_id` uuid NOT NULL <br> `payload` jsonb <br> `timestamp` timestamptz NOT NULL DEFAULT now() | `id` | `user_id` → `public.users(id)` (or `auth.users` for legacy rows) | – | – |

*Notes*: Row counts are not stored in source files; they must be queried against the live `app.db` if needed.

## 2. Authentication Architecture
| Aspect | Findings |
|--------|----------|
| **Login tables** | `public.users` holds `username` and `password_hash`. No Supabase Auth tables are used for login. |
| **Password storage** | Column `password_hash` stores bcrypt hashes generated via PostgreSQL `crypt`. No plain‑text passwords are stored. |
| **Session handling** | `public.user_sessions` stores a UUID `session_token` with an expiry. Tokens are generated server‑side (`uuid_generate_v4()`). |
| **Supabase Auth usage** | The only remaining reference is the foreign key `owner_id` in `public.workbooks` that points to `auth.users(id)`. No client‑side calls to `signInWithPassword`, `auth.admin`, or `getSession` were found in the TypeScript codebase. |
| **Auth‑related code** | Search of `frontend/src/**/*.ts*` for auth‑related keywords returned **0 matches**. All authentication is performed via custom API endpoints that query `public.users`. |
| **RLS policies** | No explicit Row‑Level Security policies on `public.users` or `public.user_sessions`. RLS exists only on `public.user_profiles` (unused) and on workbook tables via `user_roles`. |

## 3. Authorization Architecture
| Component | Summary |
|-----------|----------|
| **Roles** | Stored directly on the `users.role` column (single role per user) and additionally in `public.user_roles` for workbook‑specific permissions (owner/editor/viewer). |
| **Permissions** | Application‑level permission checks are performed in the UI (`components/ProtectedRoute.tsx`) using the role values. No separate `permissions` or `role_permissions` tables exist. |
| **Hierarchy** | Implicit hierarchy: `superadmin` > `owner` > `editor` > `viewer`. Enforced by code checks, not by DB constraints. |
| **Assignments** | Global role is set on the `users` row. Workbook‑specific role assignments are stored in `user_roles` linking a `user_id` to a `workbook_id`. |
| **Missing relationships** | No fine‑grained permission table (`permissions`, `role_permissions`). All checks are role‑based. |

## 4. User Model Audit
| Item | Detail |
|------|--------|
| **Structure** | `id` (uuid PK), `username` (unique), `password_hash`, `role`, `status`, `created_at`. |
| **Required fields** | `username`, `password_hash`, `role`. |
| **Password handling** | Bcrypt hash stored in `password_hash`; verified with PostgreSQL `crypt`. |
| **Active/Inactive** | `status` column (`active`/`inactive`). The UI previously used an `is_active` column in a legacy `users` table – this field is **not** present in the current DB‑only model. |
| **Login flow compatibility** | Current `createUser` inserts only `username` and `is_active`. For DB‑only auth it must also generate a bcrypt hash (`crypt(password, gen_salt('bf'))`) and store it in `password_hash`. |
| **Integrity** | `user_roles.user_id` references `public.users(id)` – foreign key is present and cascades on delete. |

## 5. Schema Quality Review
- **Orphaned records**: `public.workbooks.owner_id` still references `auth.users`. These rows will become orphaned once Supabase Auth is removed and need migration. 
- **Duplicate data**: Legacy `users` table (with `hashed_password`) co‑exists with the new `public.users`. Both should be reconciled. 
- **Legacy tables**: `public.user_profiles` (defined but unused) and `public.worksheet_rows` (marked legacy) remain in the schema. 
- **Unused columns**: `status` in `public.users` is defined but not currently read by the frontend (frontend checks `is_active`). May be redundant or needs alignment. 
- **Indexes**: Only primary‑key and `username` unique indexes exist. Consider adding indexes on `user_sessions.session_token` (already unique) and on `user_roles(user_id, workbook_id)` for faster RBAC look‑ups. 
- **Schema inconsistencies**: Mixed usage of `auth.users` (owner FK) and `public.users` creates a mismatch that must be resolved before full migration. 

## 6. Migration Readiness
| Requirement | Current Gap | Suggested Action |
|-------------|-------------|------------------|
| **Username + Password login** | `createUser` does not store `password_hash`; UI expects `is_active` flag. | Update UI to call a server‑side endpoint that hashes the password (`crypt`) and inserts `password_hash`. |
| **Role storage** | Global role is in `users.role`; workbook roles are in `user_roles`. UI still reads `is_active` for status. | Align UI to use `status` or add `is_active` column to `public.users`. |
| **Owner foreign key** | `workbooks.owner_id` → `auth.users(id)`. | Migrate existing workbook rows to reference the new `public.users.id` or embed owner info in a separate column. |
| **RLS policies** | None on `public.users`/`user_sessions`. | Add policies: <br>• `allow select/update/delete own user` (using `auth.uid() = id`). <br>• `allow superadmin manage all`. |
| **Session management** | No API endpoints shown; only DB schema exists. | Implement server‑side login endpoint that verifies `crypt`, creates a `user_sessions` row, and returns the token. |
| **Password reset / change** | No stored procedure. | Add endpoint that updates `password_hash` with `crypt(newPass, gen_salt('bf'))`. |
| **Legacy auth removal** | Code base still contains comments about `auth.admin.createUser`. | Remove all references and ensure no `auth.users` look‑ups remain. |

## 7. Recommended Final Design
1. **Core tables**: `public.users`, `public.user_sessions`, `public.user_roles`, `public.workbooks`, `public.worksheets`, `public.column_metadata`, `public.worksheet_rows`, `public.audit_logs`. 
2. **Authentication flow**: 
   - Client sends `username` & `password` to `/login` endpoint. 
   - Server queries `users` by `username`, verifies password using `crypt`. 
   - On success, creates a row in `user_sessions` (UUID token, expiry) and returns the token. 
   - Subsequent requests include the token; middleware validates token against `user_sessions` and loads the user row (including global `role`). 
3. **Authorization**: 
   - Global role (`users.role`) controls admin‑level UI features. 
   - Workbook‑specific RBAC enforced via `user_roles` (owner/editor/viewer) with RLS policies restricting access to rows belonging to the workbook. 
4. **Security**:
   - Enforce TLS for all API calls. 
   - Store only bcrypt hashes (`crypt`). 
   - Use HttpOnly, Secure cookies or secure storage for the session token. 
   - Add RLS policies to block any direct SELECT/UPDATE on `users` except for the owner or superadmin. 
5. **Migration plan** (high‑level):
   - Run `DATABASE_AUTH_MIGRATION.sql` to create new tables. 
   - Write a data‑migration script that copies existing `auth.users` rows into `public.users`, generating a bcrypt hash from the existing password (if retrievable) or forcing a password reset. 
   - Update `workbooks.owner_id` foreign key to reference `public.users`. 
   - Deploy server‑side login/session endpoints. 
   - Switch frontend auth code to call the new endpoints. 
   - Decommission Supabase Auth keys and remove `auth.*` references. 

## 8. Risk Assessment
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **Orphaned workbook owners** | Users lose ownership of existing workbooks. | Medium | Migration script must re‑assign owners or create a mapping table before dropping `auth.users`. |
| **Password hash incompatibility** | Existing passwords cannot be re‑hashed. | High (if passwords are not reversible). | Force password reset for all users during migration; notify users. |
| **Session token leakage** | Attackers obtain valid `session_token`. | Low (if tokens are HttpOnly & Secure). | Use short expiry, rotate tokens on logout, enforce TLS. |
| **RLS mis‑configuration** | Unauthorized data exposure. | Medium | Write exhaustive tests for each policy; run a security audit before production. |
| **UI mismatch (is_active vs status)** | Users cannot be deactivated correctly. | Low | Align UI to use `status` column or add a computed `is_active` view. |

## 9. Development Roadmap (rough)
1. **Sprint 1** – Finalise schema changes (add missing columns, adjust FK, add RLS). Write migration script.
2. **Sprint 2** – Implement server‑side authentication endpoints (`/login`, `/logout`, `/session/refresh`, `/password/change`). Add unit & integration tests.
3. **Sprint 3** – Update frontend auth helpers to use new endpoints, replace all `auth.*` imports, add UI feedback for login failures.
4. **Sprint 4** – Run data migration on staging, validate ownership & role integrity, perform security audit on RLS.
5. **Sprint 5** – Deploy to production, monitor logs, decommission Supabase Auth keys.

---
*Generated on $(date)*