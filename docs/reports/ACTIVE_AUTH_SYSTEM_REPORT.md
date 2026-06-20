# ACTIVE AUTH SYSTEM REPORT

**Date:** 2026-06-10

## 1. Inspection of `AuthContext.tsx`
The current `AuthContext` (see `frontend/src/context/AuthContext.tsx`) implements the **login** function as:

```ts
const login = async (username: string, password: string) => {
  console.log('LOGIN PAYLOAD', { username, password });
  // Generate synthetic email for Supabase auth
  const email = `${username}@ertracker.local`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) { /* log and re‑throw */ }
  setUser(data.user);
  navigate('/dashboard');
};
```

The function **always uses Supabase Auth** (`supabase.auth.signInWithPassword`). The username is merely transformed into a synthetic email address (`<username>@ertracker.local`). No interaction with the custom `users` / `user_sessions` tables is performed.

## 2. Determination of the Active Authentication System
| Option | Verdict |
|--------|---------|
| A) Supabase Auth | **Active** – the login call reaches Supabase's authentication service. |
| B) Database Auth | Inactive – there is no code that queries the `public.users` table or creates a session token in `public.user_sessions`. |
| C) Hybrid Auth | Not used – the code does not combine both mechanisms. |

## 3. Database Migration Verification (Conceptual)
The migration file `DATABASE_AUTH_MIGRATION.sql` **exists** in the repository and defines the `users` and `user_sessions` tables. However, without executing the SQL against the Supabase (or local) PostgreSQL instance we cannot confirm that the tables have been created. No automated migration step is present in the project scripts.

## 4. Existence Checks (cannot be performed programmatically here)
* **`users` table** – defined in the migration file, but existence in the live DB is unknown.
* **`user_sessions` table** – likewise defined but not verified.
* **`superadmin` user** – not created in the custom `users` table (the migration’s placeholder inserts a bcrypt hash for username `superadmin`).
* **`superadmin@ertracker.local`** – this synthetic email would need a corresponding Supabase Auth user; there is no evidence such a user exists.

## 5. Why Login Currently Fails (if it does)
1. **User not present in Supabase Auth** – Supabase will reject credentials for an email that has never been registered.
2. **Password mismatch** – even if the synthetic email exists, the password must match the one stored in Supabase (independent of the bcrypt hash in the `users` table).
3. **Hybrid expectation** – developers may assume the custom DB tables are used, leading to missing user records in Supabase.

## 6. Required Fix
### Option A – Continue using Supabase Auth (recommended for now)
* Create the synthetic users in Supabase Auth (e.g., `superadmin@ertracker.local` with a known password).
* Update any documentation to reflect that authentication is **Supabase‑only**.

### Option B – Switch to Database‑Only Auth
* Replace the `login` implementation with a query against `public.users` and generate a session token in `user_sessions`.
* On success, return the token to the client (store in HttpOnly cookie) and skip Supabase Auth entirely.
* Remove the synthetic‑email generation and all Supabase Auth calls.

### Option C – Hybrid (not advised)
* Keep Supabase for session management but authenticate against `users` table, then programmatically create a Supabase session via the Service Role key.

## 7. Recommendations
1. **Immediate fix:** Create the required Supabase users (including `superadmin@ertracker.local`). This will make the current login flow functional.
2. **Long‑term:** Decide whether to retire Supabase Auth entirely and implement the Database‑Only Auth flow as described in `DATABASE_AUTH_ARCHITECTURE.md`.
3. Update the **Project Knowledge Base** to reflect the chosen authentication strategy and record the migration status.

---

*Generated on 2026‑06‑10.*
