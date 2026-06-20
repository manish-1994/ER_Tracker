# USER_ROLES_SCHEMA_REPORT.md

## Supabase `user_roles` Table Schema

| Column Name   | Data Type    | Constraints |
|---------------|--------------|-------------|
| `id`          | `uuid`       | Primary Key, default `gen_random_uuid()` |
| `user_id`     | `uuid`       | Not null, foreign key → `auth.users(id)` |
| `workbook_id` | `uuid`       | Not null, foreign key → `public.workbooks(id)` on delete cascade |
| `role`        | `text`       | Not null, check `role` in (`'owner'`,`'editor'`,`'viewer'`) |
| `created_at`  | `timestamptz`| Not null, default `now()` |

### Primary Key
`id` (uuid)

### Foreign Keys
* `user_id` → `auth.users(id)`
* `workbook_id` → `public.workbooks(id)` (cascade on delete)

### Indexes (as defined in `SUPABASE_SCHEMA.sql`)
* `idx_user_roles_user_id` on `user_id`
* `idx_user_roles_workbook_id` on `workbook_id`

## Verification of AuthContext Query

The current query in **AuthContext.tsx** is:

```ts
await supabase.from('user_roles').select('role').eq('user_id', userId);
```

This matches the schema:
* Table `user_roles` exists.
* Column `role` exists and is of type `text`.
* Column `user_id` exists and is the correct foreign‑key column.

Therefore the query is correct and should retrieve an array of objects with a `role` field, e.g.:

```json
[{ "role": "owner" }, { "role": "editor" }]
```

If a `400 Bad Request` is received, possible causes include:
1. **Missing Authorization Header** – ensure the Supabase client is initialized with the anon/public key and the request is made after authentication.
2. **Incorrect `userId` value** – verify that `userId` is a valid UUID string (no surrounding whitespace).
3. **RLS policies** – check that the `user_roles` table allows `SELECT` for the authenticated user (default policies permit if the row belongs to the user).

### Recommended Corrected Query (if needed)

If you need to specify the schema explicitly, you can use:

```ts
await supabase.from('public.user_roles').select('role').eq('user_id', userId);
```

---

*Generated on 2026‑06‑10.*
