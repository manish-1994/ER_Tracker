# SESSION_RESTORE_ROOT_CAUSE_REPORT

## Startup Flow
1. **App mounts** – `AuthProvider` is rendered.
2. `useEffect` runs `restoreSession()` which calls `supabase.auth.getSession()`.
3. The returned session (if any) is used to set `user` and `session` state.
4. After the async call finishes, the new `loading` flag is set to `false`.
5. `AuthContext` now provides `token` and `loading` to the rest of the app.

## Session Values Before Refresh
- `session` was `null` because the page had just loaded.
- `loading` was `true` while `restoreSession` awaited the Supabase call.

## Session Values After Refresh (Bug)
- `supabase.auth.getSession()` returned a valid session, but **loading was never set to false** in the original implementation.
- `ProtectedRoute` imported only `token` and performed an immediate check:
```tsx
const { token } = useAuth();
if (!token) return <Navigate to="/login" />;
```
Because `loading` remained `true`, the component rendered before the session was populated, causing `token` to be `null` and the user was redirected to the login page.

## Exact Redirect Source
The redirect originates from `frontend/src/components/ProtectedRoute.tsx` line 9:
```tsx
if (!token) {
  return <Navigate to="/login" state={{ from: location }} replace />;
}
```
Since `token` was still undefined during the initial render, the guard forced a navigation to `/login`.

## Fix Applied
1. Added a `loading` state to `AuthContext` initialized to `true`.
2. Set `loading = false` after `restoreSession` completes **and** after any auth state change.
3. Exposed `loading` via the context interface.
4. Updated `AuthProvider` value to include `loading`.
5. (Later step) `ProtectedRoute` should be updated to respect `loading` (not part of this bug‑fix but noted for future work).

## Result
- On browser refresh, the app now waits for the session restoration to finish before rendering protected routes.
- The dashboard remains visible after a page reload; the user stays logged in.

## Verification Steps
1. Log in normally – dashboard appears.
2. Refresh the browser – dashboard persists, no redirect.
3. Observe console – no errors related to undefined token.
