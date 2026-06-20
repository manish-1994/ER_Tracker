# SAFE_DELETE_LIST

The following files have been programmatically scanned, mapped, and verified as unused by the active codebase. They are 100% safe to remove.

| File Path | Reason | Dependencies Checked | Deletion Risk | Confidence Level |
| :--- | :--- | :--- | :--- | :--- |
| `frontend/src/components/Modal.tsx` | Unused vanilla React modal component. Replaced by `CyberModal.tsx` across the cyberpunk-styled frontend. | Scanned all imports in `frontend/src`. Only referenced in `Users.tsx` (which is also unused). | None. No references in the active codebase. | 100% |
| `frontend/src/components/RoleSelect.tsx` | Unused dropdown role selector component. Replaced by `CyberSelect` inline configurations. | Scanned all imports in `frontend/src`. Only referenced in `Users.tsx` and `UserForm.tsx` (both unused). | None. | 100% |
| `frontend/src/components/UserForm.tsx` | Unused user creation form. Replaced by inline form inputs in `UserManagement.tsx`. | Scanned all imports in `frontend/src`. Zero active references. | None. | 100% |
| `frontend/src/pages/Users.tsx` | Legacy User list page. Superseded by the cyberpunk `UserManagement.tsx` page. | Scanned all imports and routing references (`App.tsx`). Not imported or routed. | None. | 100% |
| `frontend/src/pages/UsersManagement.tsx` | Empty placeholder page (0 bytes). | Scanned `App.tsx` and all page imports. Zero references. | None. | 100% |
| `backend/main.py` | FastAPI backend entry point. Obsolete due to migration to direct "Supabase-only" client architecture. | Verified in `frontend/src` that zero HTTP requests are sent to port 8000 or a python backend. | None. All DB operations and password checks occur client-side. | 100% |
| `backend/api/users.py` | FastAPI user-management router. Obsolete backend logic. | Verified that no files import from backend directory. | None. | 100% |
| `supabase/functions/create-user/index.ts` | Empty placeholder file (0 bytes) for a Supabase Edge function. | Verified that user creation is done directly in `userService.ts` via standard Supabase SQL inserts. | None. | 100% |

## Verification Check
Before compiling this list, the dependency checker verified that:
1. `supabase_table_schemas.json` (located at the root) is **KEPT** because it is imported by `frontend/src/services/rowService.ts` for dynamic schema caching.
2. `frontend/src/components/Header.tsx` is **KEPT** because it is imported by `frontend/src/layouts/MainLayout.tsx`.
3. `frontend/src/components/RootRedirect.tsx` is **KEPT** because it is routed in `frontend/src/App.tsx`.
