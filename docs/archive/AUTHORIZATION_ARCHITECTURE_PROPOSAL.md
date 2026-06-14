# AUTHORIZATION_ARCHITECTURE_PROPOSAL.md

## 1. Audit of Existing Authorization Assumptions

| Area | Current Implementation | Issues Identified |
|------|------------------------|-------------------|
| **User authentication** | Supabase Auth (`supabase.auth`) provides a JWT which is stored in `AuthContext`. | Works correctly. |
| **Work‑book level RBAC** | `user_roles` table maps a **user** to a **workbook** with a role (`owner`, `editor`, `viewer`). The front‑end loads these roles on login and uses them in `ProtectedRoute` and layout components. | – Assumes that a “SuperAdmin” or system‑wide admin role exists in the same table, which it does not.\n– The table currently contains **zero rows**, so no workbook‑level permissions are actually granted. |
| **System‑wide roles** | No dedicated table. The code checks `userRoles.includes('SuperAdmin')` but this column never receives values because the schema only stores workbook‑specific roles. | – Incorrect expectation leads to a 400 error when the query returns nothing or when a role is missing.\n– No mechanism to grant admin privileges independent of a workbook. |

## 2. Separation of Concerns

To avoid conflating **system‑wide** privileges (e.g., a SuperAdmin who can manage all workbooks, users, and settings) with **workbook‑specific** access, we propose two distinct role hierarchies:

### 2.1 System Roles

| Role | Description | Typical Permissions |
|------|-------------|---------------------|
| **SuperAdmin** | Full access to every part of the system, including user management, role management, and all workbooks. | `*` (unrestricted) |
| **Admin** | Elevated privileges across the platform but may be limited by organisational policies. Can create workbooks, manage users within an organisation, and assign workbook roles. | Manage users, create/delete workbooks, assign workbook roles. |
| **User** | Regular end‑user with access only to workbooks they are explicitly granted. | Access workbooks according to workbook‑level roles (`owner`, `editor`, `viewer`). |

### 2.2 Workbook Roles

These remain scoped to a single workbook and are unchanged:

| Role | Permissions |
|------|-------------|
| **owner** | Full control of the workbook (delete, share, change schema, etc.). |
| **editor** | Can modify rows/columns but cannot delete the workbook or change ownership. |
| **viewer** | Read‑only access. |

## 3. Proposed Schema Changes

### 3.1 New `system_roles` Table

```sql
create table if not exists public.system_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id),
    role text not null check (role in ('SuperAdmin','Admin','User')),
    created_at timestamptz not null default now()
);

-- Index for fast look‑ups
create index if not exists idx_system_roles_user_id on public.system_roles(user_id);
```

*Each user will have **exactly one** row in `system_roles`. The default role for newly created accounts should be `'User'`.*

### 3.2 Keep Existing `user_roles` for Workbook Permissions

No structural changes are required for `user_roles`; it will continue to store the workbook‑specific mapping.

## 4. Updated AuthContext Role‑Loading Strategy

1. **After successful login** (or on session restore) fetch **system role** first:

```ts
const { data: sysData, error: sysError } = await supabase
  .from('system_roles')
  .select('role')
  .eq('user_id', userId)
  .single();
```

2. Store the result in a new `systemRole` state variable (e.g., `systemRole: 'SuperAdmin' | 'Admin' | 'User'`).
3. **If the system role is not `User`**, optionally skip the workbook‑specific query because a SuperAdmin/Admin already has global access.
4. **Otherwise**, load workbook‑specific roles exactly as before:

```ts
if (systemRole === 'User') {
  const { data: wbData, error: wbError } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  // store workbook roles in `userRoles`
}
```

5. Expose both via the context:

```ts
interface AuthContextProps {
  token: string | null;
  login: (username:string,password:string)=>Promise<void>;
  logout: () => void;
  loading: boolean;
  systemRole: 'SuperAdmin' | 'Admin' | 'User';
  workbookRoles: string[]; // roles for the current workbook (owner/editor/viewer)
}
```

## 5. Impact on Front‑End Guard Logic

`ProtectedRoute` can now make decisions based on **both** layers:

```tsx
const { token, loading, systemRole, workbookRoles } = useAuth();
if (loading) return <Loading/>;
if (!token) return <Navigate to="/login"/>;

// System‑wide bypass for SuperAdmin/Admin
if (['SuperAdmin','Admin'].includes(systemRole)) return children;

// Workbook‑specific check (only relevant when systemRole is 'User')
if (requiredRole) {
  const has = workbookRoles.includes(requiredRole);
  if (!has) return <Navigate to="/unauthorized"/>;
}
return children;
```

## 6. Migration Plan (high‑level, not executed yet)

1. **Create `system_roles` table** using the SQL above.
2. **Back‑fill** existing users with the default role `'User'` (`INSERT INTO system_roles SELECT id, 'User', now() FROM auth.users`).
3. **Optionally** add a UI for an existing Admin to promote a user to `SuperAdmin` or `Admin`.
4. **Update RLS policies**:
   - `system_roles` should be readable by the owning user and by any `SuperAdmin`.
   - `user_roles` queries should now also check that the requester is either the row owner, an `Admin`, or a `SuperAdmin`.

## 7. Summary

* Introduce a dedicated `system_roles` table to model global privileges.
* Keep `user_roles` for workbook‑scoped RBAC.
* Extend `AuthContext` to load and expose both `systemRole` and `workbookRoles`.
* Adjust guard components to respect the two‑level hierarchy, allowing SuperAdmin/Admin to bypass workbook checks.
* Provide a migration outline for adding the new table and populating default values.

---

*Prepared on 2026‑06‑10.*
