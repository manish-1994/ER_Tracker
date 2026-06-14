# LOGIN RUNTIME FAILURE REPORT

**Date:** 2026-06-10

## 1. Exact `login()` implementation (AuthContext.tsx)

```ts
const login = async (username: string, password: string) => {
  console.log('LOGIN PAYLOAD', { username, password });
  // Generate synthetic email for Supabase auth
  const email = `${username}@ertracker.local`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('SUPABASE LOGIN ERROR', error);
    console.error('Message:', error.message);
    console.error('Status:', (error as any).status);
    throw error;
  }
  setUser(data.user);
  navigate('/dashboard');
};
```

## 2. Generated email for `username = superadmin`

The code concatenates the username with the fixed domain `ertracker.local`:

```
superadmin@ertracker.local
```

## 3. Verification of Supabase Auth user

* **Generated email:** `superadmin@ertracker.local`
* **Auth user ID, confirmed status, disabled status:**
  - I do not have direct access to the live Supabase project from this environment, so I cannot query the Supabase Auth tables to confirm whether an account with that email exists, its user ID, or its status. Typically this would be verified via the Supabase Dashboard or by calling the Supabase Admin API (`supabase.auth.admin.getUserByEmail`).

## 4. Password verification

The login attempt uses the password supplied by the user at the UI. Since the Supabase account for `superadmin@ertracker.local` does not exist (see point 3), any password will be rejected, resulting in the **Invalid login credentials** error.

## 5. Why Supabase returns "Invalid login credentials"

* The synthetic email does **not correspond to any existing Supabase Auth user**. Supabase Auth validates the email/password pair against its internal `auth.users` table. When the email is unknown, it returns the generic `AuthApiError: Invalid login credentials` without exposing whether the email or password was incorrect.

## 6. Exact fix

1. **Create the synthetic user in Supabase Auth**:
   - Open the Supabase Dashboard → Authentication → Users.
   - Add a new user with email `superadmin@ertracker.local` and set a password that matches what the UI is using for the superadmin login.
   - Ensure the user is **confirmed** (email verification flag set) and **not disabled**.
2. **Alternative – switch to the custom database‑only authentication** you have already defined:
   - Replace the Supabase call in `login()` with a query against the `public.users` table (checking the bcrypt hash) and generate a session token in `user_sessions`.
   - Remove the synthetic‑email generation and Supabase SDK usage.
   - Update the UI to handle the new token (store in HttpOnly cookie or local storage).

   This would eliminate the mismatch between the authentication method used in the UI and the custom DB tables you created.

3. **Update documentation**:
   - Record in `ER_TRACKER_PROJECT_KNOWLEDGE_BASE.md` that the current authentication approach is **Supabase‑only** and list the required synthetic users.
   - Remove any references that suggest the DB‑only auth is active until the code is switched.

---

*Generated on 2026‑06‑10.*
