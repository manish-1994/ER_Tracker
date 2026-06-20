# SUPERADMIN SETUP REPORT

## Summary

Default SuperAdmin bootstrap completed successfully. User **superadmin** is assigned role **SuperAdmin** in `public.user_roles`.

| Item | Result |
|------|--------|
| User created | No — already existed |
| User ID | `9` |
| Username | `superadmin` |
| Role ID | `1` |
| Role name | `SuperAdmin` |
| Role assignment created | No — mapping already existed |
| Verification | **Passed** |

---

## Implementation

Script: `frontend/scripts/setup-superadmin.mjs`

Steps performed:

1. Checked `public.users` for username `superadmin` — **found** (id `9`)
2. Skipped user insert (no duplicate created)
3. Resolved role: `SELECT id FROM public.roles WHERE name = 'SuperAdmin'` → **id `1`**
4. Checked `public.user_roles` for `(user_id=9, role_id=1)` — **already present**
5. Ran verification join (application-level)

Password for new installs (when user does not exist):

- **Username:** `superadmin`
- **Password:** `SuperAdmin@123` (hashed with bcryptjs, cost factor 10)

---

## Role Assignment Result

| Field | Value |
|-------|-------|
| `user_id` | `9` |
| `role_id` | `1` |
| Mapping status | Already existed — no duplicate insert |

---

## Verification Query

Equivalent SQL:

```sql
SELECT
  u.id,
  u.username,
  r.name AS role
FROM users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.id = ur.role_id
WHERE u.username = 'superadmin';
```

### Result

| id | username | role |
|----|----------|------|
| 9 | superadmin | SuperAdmin |

**Expected:** `superadmin → SuperAdmin`  
**Actual:** `superadmin → SuperAdmin`  
**Status:** ✓ Passed

---

## How to Re-run

From the `frontend` directory:

```bash
node scripts/setup-superadmin.mjs
```

The script is idempotent:

- Does not create a duplicate `superadmin` user
- Ensures `superadmin → SuperAdmin` exists in `public.user_roles`
- Writes machine-readable output to `frontend/scripts/setup-superadmin-result.json`

---

## Login Verification

After setup, log in at `/login` with:

- Username: `superadmin`
- Password: `SuperAdmin@123`

Expected auth state:

```json
{
  "id": 9,
  "username": "superadmin",
  "roles": ["SuperAdmin"]
}
```

Sidebar should show: Dashboard, Workbooks, Users, Roles, Profile, Admin Control Center.

---

*Report generated after SuperAdmin bootstrap run.*
