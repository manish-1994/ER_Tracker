# Password Hash Audit

## Overview
The application stores password hashes in the `public.users` table under the `hashed_password` column.  During login diagnostics it was discovered that the login code uses `bcrypt.compare`, so all stored hashes must be bcrypt hashes (`$2a$`, `$2b$`, or `$2y$`).  Any Argon2 hashes (`$argon2...`) would cause authentication failures.

## Query to find Argon2 hashes
```sql
SELECT id, username, substr(hashed_password,1,20) AS hash_prefix
FROM users
WHERE hashed_password LIKE '$argon2%';
```
**Result:** No rows returned – there are currently **no users** with Argon2 hashes.

## Query to list bcrypt hashes (reference)
```sql
SELECT id, username, substr(hashed_password,1,7) AS hash_prefix
FROM users
WHERE hashed_password LIKE '$2%';
```
**Result:** Existing users (e.g., `superadmin`) have bcrypt hashes (`$2a$`, `$2b$`, `$2y$`).

## Findings
1. No Argon2‑hashed users were found in the database.
2. The login failure for the user `test` was due to a missing user record, not a hash‑algorithm mismatch.
3. The authentication flow (direct insert into `public.users` with bcrypt hashing) is consistent across the codebase.

## Recommendations
* **Option A – Delete legacy Argon2 users** and recreate them using the existing `createUser` flow, which hashes passwords with bcrypt.
* **Option B – One‑time migration utility** that re‑hashes Argon2 passwords to bcrypt after verifying the original password.

## Next Steps
1. Verify that any newly created users have hashes beginning with `$2a$`, `$2b$`, or `$2y$`.
2. Run the login test for the `superadmin` account to confirm successful bcrypt validation.

---
*Prepared by Cline – architecture specialist.*