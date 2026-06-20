# SUPABASE V2 AUTH LISTENER FIX REPORT

## Summary

After migrating to Supabase JS v2, the auth state listener cleanup caused a runtime error because the returned object changed shape. The original code attempted to call `authListener?.unsubscribe()`, but v2 returns `{ data: { subscription } }`.

## Issue Identified

* **File:** `frontend/src/context/AuthContext.tsx`
* **Problematic Code:**
  ```ts
  const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });
  return () => {
    authListener?.unsubscribe();
  };
  ```
* **Error:** `TypeError: authListener?.unsubscribe is not a function`

## Fix Implemented

Replaced the listener setup with the correct v2 pattern:
```ts
const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
  setUser(session?.user ?? null);
});
return () => {
  subscription?.unsubscribe();
};
```

The change extracts the `subscription` object and calls its `unsubscribe` method during cleanup.

## Verification

1. **Login** – Works, user state is set and navigation to dashboard occurs.
2. **Logout** – Works, session cleared, navigation to login.
3. **Session Restore** – After page refresh, the user remains logged in if the session is valid.
4. **Protected Routes** – Guarded routes correctly redirect unauthenticated users.
5. **Build** – `npm run build` completes without errors.

No further instances of the old listener pattern were found in the repository.

---

*Generated on 2026‑06‑10.*
