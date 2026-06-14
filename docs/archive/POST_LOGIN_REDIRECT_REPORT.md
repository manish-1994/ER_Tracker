# POST‑LOGIN REDIRECT REPORT

**Date:** 2026-06-10

## 1. Symptom

After a successful authentication (`AUTH DATA` contains a valid `user` and `session`, `AUTH ERROR` is `null`), the application redirects the user back to the `/login` page instead of staying on the dashboard.

## 2. Investigation

### Components inspected

1. `frontend/src/context/AuthContext.tsx`
2. `frontend/src/App.tsx`
3. `frontend/src/components/RootRedirect.tsx`
4. `frontend/src/layouts/MainLayout.tsx`
5. `frontend/src/components/ProtectedRoute.tsx`
6. Role‑based guards used in route definitions.

### Key findings

- **AuthContext** was exposing the token as `user?.access_token`. In Supabase v2 the access token lives on the **session** object (`session.access_token`), not on the user object. This caused `token` to be `null` even when the user was authenticated.
- `ProtectedRoute` checks `const token = useAuth().token;` and redirects to `/login` when the token is falsy.
- The diagnostics added to `AuthContext` now log the actual `USER`, `SESSION`, and derived `TOKEN` values.

During a manual test the console showed:

```
USER: { id: "...", ... }
SESSION: { access_token: "eyJhbGci...", ... }
TOKEN: eyJhbGci...
```

Thus, the token existed on `session.access_token` but was never passed to the context, causing the guard to treat the user as unauthenticated.

## 3. Root cause

`AuthContext` provided `token: user?.access_token ?? null` instead of `session?.access_token`. The guard component consequently redirected authenticated users back to the login page.

## 4. Fix

Update the context provider to expose the token from the **session** object:

```tsx
<AuthContext.Provider value={{ token: session?.access_token ?? null, login, logout }}>
```

The temporary diagnostics already added to the provider confirm the correct values during runtime.

## 5. Outcome

- After applying the fix, logging in as `superadmin` with password `SuperAdmin@123` redirects to `/dashboard` and remains authenticated.
- The token is correctly stored in the context, allowing `ProtectedRoute` and other guards to permit access.

---

*Generated on 2026‑06‑10.*
