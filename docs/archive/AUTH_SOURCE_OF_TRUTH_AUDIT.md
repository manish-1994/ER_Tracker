# Authentication Source of Truth Audit

## 1. Login Flow Trace
**Login Page** – `frontend/src/pages/Login.tsx`
* Calls `login` from `AuthContext` on form submit.

**AuthContext** – provides `login` which internally uses `supabase.auth.signInWithPassword` from the Supabase client.
* On successful login, Supabase returns a session object which is stored in context and persisted via `supabase.auth.getSession`.

**authHelper** – helper functions for session restoration and token handling, all based on Supabase Auth SDK.

**Session Restoration** – On app start, `AuthContext` calls `supabase.auth.getSession()` to restore the current session from cookies/local storage.

**Authorization** – UI checks `systemRole` derived from the Supabase user’s `app_metadata` to conditionally render admin‑only routes (e.g., Users page).

> **Result:** The active authentication provider is **Supabase Auth** (the SDK is used for login, session handling, and role checking).

## 2. Project‑wide Search Findings
The following patterns were searched across the entire `frontend` directory:
* `signInWithPassword` – **found** in `Login.tsx` (used for login).
* `auth.admin` – **found** in `userService.ts` (previously called `supabase.auth.admin.createUser`). This call has been **removed** in the latest refactor.
* `auth.users` – referenced only indirectly via foreign‑key constraints in the SQL schema (`owner_id uuid not null references auth.users(id)`).
* `getSession` – used in `AuthContext` (Supabase SDK).
* `hashed_password`, `password_hash`, `bcrypt`, `argon2`, `crypt(` – **no occurrences** in the frontend source code.

> **Conclusion:** No custom password handling or legacy authentication code remains in the frontend.

## 3. Database Schema Audit
The current `SUPABASE_SCHEMA.sql` defines tables referencing **`auth.users`** for ownership and foreign keys. There is **no `users` table** defined in this file, indicating that a custom users table has been removed from the active schema.

Legacy migrations (outside the visible schema) may still contain a `public.users` table with a `hashed_password` column, which explains the runtime `23502` error when inserting without that column. However, the active schema used by the application does **not** include that column.

## 4. Determination of Active Authentication Model
**Model A – Supabase Auth**
* Used for login (`signInWithPassword`).
* Session management via Supabase SDK.
* Role information stored in `app_metadata` and accessed through `systemRole`.

**Model B – Database‑only authentication**
* No evidence of custom password verification code.
* No tables with password hashes are actively used.

**Chosen Model:** **Supabase Auth** is the sole authentication mechanism currently active in the codebase.

## 5. Recommendation (Target Deployment: React + Supabase + Vercel)
* **Adopt Supabase Auth as the single source of truth** for all authentication and user identity.
* Remove any remaining legacy `public.users` table or at least drop the `hashed_password` column and its NOT NULL constraint.
* Store additional profile information in a lightweight `profiles` (or `users`) table that references `auth.users(id)`.
* Implement user‑creation via a secure backend (Edge Function or Vercel serverless) that uses a **service‑role key** to call `supabase.auth.admin.createUser` and then creates the corresponding profile record.
* Update all UI code to call this backend endpoint rather than attempting admin calls from the browser.

---
*Report generated to audit the authentication flow, identify the active model, and provide a clear recommendation.*