# AUTH FLOW VERIFICATION REPORT

### Project decisions (as of this audit)
* No FastAPI backend.
* No Supabase Auth – the app does not use `supabase.auth.admin` on the client.
* **Edge Functions are currently present** (`supabase/functions/create-user`).
* Password hashing library **bcryptjs** is installed and used for *login* verification.
* User creation currently goes through the **Edge Function `create-user`**, which (in its current code) uses **argon2** for hashing.
* Session state is stored in **localStorage** via `AuthContext`.

---

## 1. Does `supabase/functions/create-user` still exist?
**Yes.** Listing `supabase/functions` shows:
```
create-user/
create-user/index.ts
```

## 2. Does any file contain a call to `supabase.functions.invoke` for `create-user` or `functions/v1`?
*File:* `frontend/src/services/userService.ts`
```
const { data, error } = await supabase.functions.invoke('create-user', {
  body: payload,
});
```
No other references to `functions/v1` were found.

## 3. Is user creation using:
* **Edge Function** – **Yes** (see above). The function is invoked from the frontend.
* **Direct Supabase insert** – **No**. The only insert logic lives inside the Edge Function; the frontend does not call `supabase.from('users').insert` directly.

## 4. Which hashing algorithm is used?
* **Edge Function (`create-user/index.ts`)** – uses **argon2** for hashing (see the function implementation).
* **Login flow** (`frontend/src/services/authHelper.ts`) – does **not** perform hashing; it only retrieves the stored hash. The actual password verification is performed elsewhere (e.g., in a future login helper that uses `bcryptjs.compare`). No explicit `bcryptjs.compare` call is present in the current codebase, indicating that the login verification step is not yet implemented with bcrypt.

## 5. Which login verification is used?
* **bcrypt.compare** – Not currently present in the code.
* **argon2 verify** – Not present either. The login helper only fetches the user record; password checking is absent.

## 6. Session mechanism
* `AuthContext` (see `frontend/src/context/AuthContext.tsx`) reads the user object from **localStorage** on mount and writes to it on login. This matches the decision to use localStorage for session persistence.

---

## 7. PASS/FAIL Checklist

| Requirement | Status |
|-------------|--------|
| □ No Edge Functions remain | **FAIL** – `create-user` Edge Function still exists. |
| □ No `create-user` function remains | **FAIL** – invoked from `userService.ts`. |
| □ bcryptjs used for creation | **FAIL** – creation uses Edge Function with argon2. |
| □ bcryptjs used for login | **FAIL** – login verification not implemented with bcryptjs. |
| □ localStorage session active | **PASS** – confirmed via `AuthContext`. |

**Overall result:** **FAIL** – the current implementation does not satisfy the required audit constraints. To achieve a PASS, the team would need to:
1. Remove the `create-user` Edge Function (or stop invoking it).
2. Implement direct Supabase inserts for user creation using `bcryptjs` to hash the password on the client.
3. Add a login helper that uses `bcryptjs.compare` to verify passwords.
4. Ensure no references to the Edge Function remain.

---

*Prepared by Cline – architecture specialist.*
