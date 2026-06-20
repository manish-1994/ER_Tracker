# LOGIN SCHEMA AUDIT

## Supabase Tables

```
public.workbooks
public.worksheets
public.column_metadata
public.worksheet_rows
public.user_roles
public.audit_logs
auth.users (managed by Supabase Auth)
```

### User‑related information

* **Emails** are stored in `auth.users.email` – this is the only source of email addresses for authentication.
* **Usernames** are **not** stored in any table. The schema contains no `user_profiles` or `username` column.
* The legacy FastAPI login used a custom `username` field stored in an undocumented table, which no longer exists after migration to Supabase.

## Findings

1. The attempted username‑to‑email lookup (`user_profiles` table) fails with `PGRST205: Could not find table: public.user_profiles`.
2. All authentication must therefore use **email** together with the password via `supabase.auth.signInWithPassword`.
3. No additional mapping table is present; any existing usernames would need to be migrated into `auth.users.email` or removed.

## Recommended Authentication Strategy

* Update the login UI to collect **email** instead of username.
* Remove any username‑lookup logic from `AuthContext`.
* If legacy usernames must be supported, create a migration that populates a new `user_profiles` table with `username` ↔ `email` mappings, then adjust the login code accordingly. Until such migration is performed, the application should enforce email‑based login only.

---

*Generated on 2026‑06‑10.*
