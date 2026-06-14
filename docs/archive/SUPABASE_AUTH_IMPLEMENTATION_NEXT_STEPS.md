# SUPABASE AUTH IMPLEMENTATION – NEXT STEPS

## Overview
The project now uses **Supabase Auth only**. All client‑side attempts to call `supabase.auth.admin.createUser` have been removed and replaced with a clear placeholder indicating that user provisioning must happen on the server.

## 1. Verify Users Table Schema (Phase 1)
The `users` table is defined in `SUPABASE_SCHEMA.sql` and only contains the columns required for the application:

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `uuid` | Primary key, default `gen_random_uuid()` |
| `username` | `text` | `NOT NULL` |
| `is_active` | `boolean` | `NOT NULL` |

No legacy columns such as `hashed_password` or `password_hash` exist.

## 2. Remove Browser‑Side Admin Calls (Phase 2)
`frontend/src/services/userService.ts` now logs a warning instead of attempting `auth.admin.createUser`. The new placeholder function `createUserViaServer` throws a clear error until a server‑side endpoint is implemented.

## 3. Future Server‑Side Endpoint Design (Phase 3)
### POST `/create-user`
*Location*: Supabase Edge Function **or** Vercel Serverless Function.

**Request payload** (JSON):
```json
{
  "username": "string",
  "password": "string",
  "role_ids": [number]
}
```

**Response payload** (JSON) on success:
```json
{
  "user": {
    "id": "uuid",
    "username": "string",
    "is_active": true
  },
  "roles_assigned": ["owner","editor","viewer"]
}
```

**Error payload** (JSON):
```json
{ "error": "Description of the failure" }
```

The function will:
1. Call `supabase.auth.admin.createUser` with the supplied email/username and password.
2. Insert a record into the `users` table linking to the Auth user ID.
3. Insert rows into `user_roles` for each `role_id` provided.
4. Return the created user profile.

## 4. Placeholder Integration Layer (Phase 4)
The new `createUserViaServer` function in `userService.ts` is a stub that will eventually call the above endpoint using `fetch` or the Supabase client’s `functions.invoke` API.

## 5. Documentation Updates (Phase 5)
* `ER_TRACKER_PROJECT_KNOWLEDGE_BASE.md` – Updated section **Authentication** to note that user provisioning is now server‑side only.
* Added this **NEXT STEPS** document to guide implementation.

---
*Generated on $(date)*