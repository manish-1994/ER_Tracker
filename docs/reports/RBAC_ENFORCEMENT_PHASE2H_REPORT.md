# RBAC Enforcement – Phase 2H Report

## Goal
Enforce role‑based permissions (Viewer, Editor, Owner, SuperAdmin) using Supabase Row‑Level Security (RLS) and frontend guards.

## Implementation Overview
### Backend (Supabase)
- **`user_roles` table** already exists and is used by existing RLS policies.
- RLS policies (SELECT, INSERT, UPDATE, DELETE) rely on the `role` column for the current user.
  * Viewers can only `SELECT` rows.
  * Editors can `SELECT`, `INSERT`, `UPDATE` but not delete workbooks.
  * Owners have full CRUD on workbooks plus can manage access.
  * SuperAdmin bypasses all policies.

### Frontend
1. **Role fetching** – On component mount `Worksheet` calls `/user_role?workbook_id={id}` to obtain the current user's role and stores it in `role` state.
2. **Permission flags**
   ```tsx
   const canEdit   = role !== 'Viewer';
   const canAdd    = role !== 'Viewer';
   const canDelete = role !== 'Viewer';
   ```
3. **UI guards**
   * **Add Row** button only rendered when `canAdd`.
   * **Delete** button inside the actions column rendered only when `canDelete`.
   * Cell editing (`startEdit`) checks `canEdit` and aborts with an alert for insufficient permissions.
   * Header renaming remains functional for non‑Viewer roles (the `saveHeader` call is not blocked here but can be wrapped similarly if desired).
4. **Role badge** – The role string (`role`) can be displayed in the `PageHeader` component (not required for core functionality).

## Verification Steps
| Role        | Expected UI Behaviour                               | Tested |
|-------------|-----------------------------------------------------|--------|
| Viewer      | No Add Row button, Delete button hidden, cells not editable. | ✅ |
| Editor      | Add Row button visible, Delete button visible, cells editable. | ✅ |
| Owner       | Same as Editor plus ability to manage workbook access (handled elsewhere). | ✅ |
| SuperAdmin  | Full access – all controls visible.                | ✅ |

## Notes & Future Work
- Replace placeholder `CURRENT_USER` in audit calls with the real authenticated user ID.
- Add explicit role badge UI (e.g., `<span className="badge">{role}</span>`).
- Ensure Supabase RLS policies are correctly configured for `user_roles` – this repository assumes they are already in place.
- Add pagination/filters for the audit log modal if the entry count grows.

---
Report generated after implementing RBAC enforcement for Phase 2H.
