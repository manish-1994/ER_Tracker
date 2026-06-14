# POST‑LOGIN REDIRECT ROOT CAUSE

**Date:** 2026-06-10

### 1. Symptom

After a successful login (`AUTH DATA` shows a valid `user` and `session`, `AUTH ERROR` is `null`), the application immediately redirects the user back to `/login` instead of staying on the dashboard.

### 2. Investigation

The redirect chain is:

1. `Login.tsx` calls `login()` from `AuthContext` and executes `navigate('/dashboard')`.
2. The `dashboard` route is wrapped in `ProtectedRoute`.
3. `ProtectedRoute` obtains the authentication token via `const token = useAuth().token;`.
4. If `token` is falsy, `ProtectedRoute` returns `<Navigate to="/login" replace />`.

#### Key files inspected

- **frontend/src/context/AuthContext.tsx** – provides `token`.
- **frontend/src/components/ProtectedRoute.tsx** – performs the redirect based on `token`.

#### Findings

In **AuthContext.tsx** the token is derived from:

```tsx
<AuthContext.Provider value={{ token: user?.access_token ?? null, login, logout }}>
```

Supabase v2 stores the access token on the **session** object (`session.access_token`), **not** on the `user` object. Consequently, after login `user?.access_token` is `null`, so `token` becomes `null`.

`ProtectedRoute.tsx` (simplified) contains the line that triggers the redirect:

```tsx
if (!token) return <Navigate to="/login" replace />;
```

Because `token` is `null`, this condition is true, causing the dashboard view to redirect back to the login page.

### 3. Root Cause

**AuthContext provides the wrong token source** – it uses `user?.access_token` instead of `session?.access_token`. The guard component therefore perceives the user as unauthenticated.

### 4. Fix

Update the context provider to expose the token from the session object:

```tsx
<AuthContext.Provider value={{ token: session?.access_token ?? null, login, logout }}>
```

After this change, `ProtectedRoute` receives a valid token and no longer redirects to `/login`.

### 5. Verification Steps

1. Log in with `superadmin / SuperAdmin@123`.
2. Observe console output showing:
   ```
   USER: {...}
   SESSION: { access_token: "eyJ..." }
   TOKEN: eyJ...
   ```
3. Confirm navigation lands on `/dashboard` and stays there.
4. Ensure `ProtectedRoute` no longer renders `<Navigate to="/login" />`.

---

*Generated on 2026‑06‑10.*
