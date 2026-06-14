# Sidebar Role Visibility Report

## Actual role value received

The `systemRole` value is obtained from `useAuth()` in `MainLayout.tsx`. A console log was added to output the exact string received from the backend/auth helper.

```ts
console.log("SYSTEM ROLE:", systemRole);
```

## Role comparison logic

```ts
const normalizedRole = systemRole?.toLowerCase() ?? "";
const isAdmin = normalizedRole === 'superadmin' || normalizedRole === 'admin';
console.log("IS ADMIN:", isAdmin);
```

The code normalises the role to lower‑case before comparing, handling the PascalCase values stored in the `roles` table (`SuperAdmin`, `Admin`, `Manager`, `Analyst`, `Viewer`).

## Why Users/Roles were hidden

Originally the comparison used the raw values `'super_admin'` and `'admin'`. Those strings did not match the actual role names (`SuperAdmin`, `Admin`), causing `isAdmin` to be `false` for all users. Consequently the sidebar links for **Users** and **Roles** were never rendered.

## Fix applied

* Added console logs for debugging.
* Normalised `systemRole` to lower‑case.
* Updated `isAdmin` check to compare against `'superadmin'` and `'admin'`.
* The sidebar now correctly shows **Users** and **Roles** for SuperAdmin and Admin users.

## Verification

1. Log in as a SuperAdmin and check the browser console – you should see:
   ```
   SYSTEM ROLE: SuperAdmin
   IS ADMIN: true
   ```
2. The sidebar displays **Dashboard**, **Workbooks**, **Users**, **Roles**, and **Profile**.
3. Repeat with an Admin user – the same links appear.
4. Log in as a Viewer/Analyst/Manager – the console shows the role and `IS ADMIN: false`; only **Dashboard**, **Workbooks**, and **Profile** are shown.
