# POST‑LOGIN REDIRECT FIX REPORT

**Date:** 2026-06-10

## Issue

After a successful authentication (`AUTH DATA` contains a valid `user` and `session`, `AUTH ERROR` is `null`), the application immediately redirects the user back to `/login`.

## Root Cause

`AuthContext` exposed the token as `user?.access_token`. In Supabase v2 the access token resides on the **session** object (`session.access_token`). Consequently the token was `null`, causing `ProtectedRoute` to treat the user as unauthenticated and redirect.

## Fix Implemented

1. **State Management** – Added separate `session` state alongside `user`.
2. **Session Restoration** – On component mount, restored both `user` and `session` from `supabase.auth.getSession()`.
3. **Auth State Change Listener** – Updated listener to set both `user` and `session`.
4. **Login Function** – After a successful sign‑in, stored `data.user` and `data.session`.
5. **Provider Token** – Changed the context provider to expose `token: session?.access_token ?? null`.
6. **JSX Fix** – Wrapped diagnostics and provider in a React fragment to satisfy JSX syntax.

### Code Changes (excerpt)

```tsx
// State declarations
const [user, setUser] = useState<any>(null);
const [session, setSession] = useState<any>(null);

// Restore session
const { data: { session } } = await supabase.auth.getSession();
if (session?.user) {
  setUser(session.user);
  setSession(session);
}

// Auth state change
supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);
  setSession(session ?? null);
});

// Login
setUser(data.user);
setSession(data.session);

// Provider
<AuthContext.Provider value={{ token: session?.access_token ?? null, login, logout }}>
```

## Verification Steps

1. Log in with `superadmin / SuperAdmin@123`.
2. Observe console output showing a non‑null `TOKEN` derived from `session.access_token`.
3. Verify navigation lands on `/dashboard` and remains there.
4. Confirm `ProtectedRoute` no longer redirects to `/login`.

## Result

The login flow now correctly redirects to the dashboard and stays authenticated. The bug is resolved and documented.

---

*Generated on 2026‑06‑10.*
