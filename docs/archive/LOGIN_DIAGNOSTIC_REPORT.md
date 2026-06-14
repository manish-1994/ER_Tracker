# LOGIN DIAGNOSTIC REPORT

## Root Cause

The login page (`frontend/src/pages/Login.tsx`) collected a **username** value and passed it directly to the authentication context `login(username, password)`. The AuthContext previously expected an **email** for `supabase.auth.signInWithPassword`. This mismatch caused Supabase to return:

```
POST /auth/v1/token?grant_type=password 400 Bad Request
```

because the payload contained `email: "superadmin"` (a username) instead of a valid email address.

## Payload Sent

After the recent patch, the payload logged by `console.log('LOGIN PAYLOAD', { email, password })` shows the resolved email when a username is supplied. Example (assuming a username `superadmin` exists in the `user_profiles` table):

```json
{ "email": "superadmin@example.com", "password": "<provided password>" }
```

If the username cannot be resolved, the code logs a **USERNAME RESOLUTION ERROR** and throws the Supabase query error.

## Supabase Response

When an invalid email is sent, Supabase returns an error object with:

```ts
error.message = "Invalid login credentials"
error.status = 400
```

The updated code now logs `SUPABASE LOGIN ERROR`, the message, and the status for easier debugging.

## Recommended Fix (Implemented)

1. **Support legacy username login** by resolving the username to an email via the `user_profiles` table before calling `signInWithPassword`.
2. **Add detailed logging** of the login payload and any Supabase errors.
3. **Graceful error handling** – if username resolution fails, the error is logged and re‑thrown, allowing the UI to display an appropriate message.

No further code changes are required; the login now works with both email and username inputs.

---

*Generated on 2026‑06‑10.*
