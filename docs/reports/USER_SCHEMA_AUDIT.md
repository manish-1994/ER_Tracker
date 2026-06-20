# User Schema Unification Audit Report

## Date: 2026-06-18

---

## 1. Actual Database Schema (users.id)

| Source | users.id Type | Primary Key | Constraints |
|--------|---------------|-------------|-------------|
| `SUPABASE_SCHEMA.sql` (line 66) | **TEXT** | `id text primary key` | NOT NULL unique |
| `DATABASE_AUTH_MIGRATION.sql` (line 5) | **UUID** | `id uuid primary key` | NOT NULL unique |
| `20260613000000_create_workspace_assignments.sql` | **BIGINT** (FK) | References `users(id)` | `user_id BIGINT REFERENCES users(id)` |
| `20260613000100_complete_schema.sql` | **BIGINT** (FK) | References `users(id)` | `user_id BIGINT REFERENCES users(id)` |
| `20260614000100_create_user_presence.sql` | **BIGINT** (FK) | References `users(id)` | `user_id BIGINT REFERENCES users(id)` |
| `MISSING_TABLES_MIGRATION.sql` | **INTEGER** (FK) | References `users(id)` | `user_id INTEGER REFERENCES users(id)` |
| `WORKSPACE_ASSIGNMENTS_MIGRATION.sql` | **INTEGER** (no FK) | - | No constraint defined |
| `SYSTEM_ROLES_MIGRATION.sql` | **UUID** (FK) | - | `user_id uuid NOT NULL` |

**Critical:** `DATABASE_AUTH_MIGRATION.sql` creates `users(id UUID)` but `SUPABASE_SCHEMA.sql` uses `users(id TEXT)`. These are incompatible - only ONE can exist.

---

## 2. Frontend Type Expectations

| File | Type Declaration | Usage Context |
|------|------------------|---------------|
| `authHelper.ts` (line 5) | `id: number` | AppUser interface |
| `authHelper.ts` (line 11, 34) | `userId: number` | loadRolesForUser, loadPermissionsForUser params |
| `userService.ts` (line 4) | `type UserId = number \| string` | Flexible parameter type |
| `presenceService.ts` (line 4) | `user_id: number` | UserPresence interface |
| `dashboardWidgetService.ts` | No explicit type | Implicit string |
| `workspaceService.ts` (line 57) | `parseInt(userId)` | Assumes string input, converts to int |
| `roleService.ts` (line 12) | `user_id: string` | UserRole interface |
| `roleService.ts` (line 94) | `parseInt(userId)` | Assumes parseable string |

**Summary:** Frontend is split between `number` (authHelper, presenceService) and `string` (roleService, workspaceService).

---

## 3. Foreign Key References to users.id

### Supabase Migrations

| Table | Column | FK Type (as defined) | References |
|-------|--------|----------------------|------------|
| `user_roles` (SUPABASE_SCHEMA.sql:47) | `user_id` | TEXT | `users(id)` |
| `audit_logs` (SUPABASE_SCHEMA.sql:56) | `user_id` | TEXT | - |
| `dashboard_widgets` (SUPABASE_SCHEMA.sql:100) | `user_id` | TEXT | `users(id)` |
| `dashboard_widgets` (SUPABASE_SCHEMA.sql:112) | `created_by` | TEXT | `users(id)` |
| `workspace_assignments` (20260613000000:8) | `user_id` | BIGINT | `users(id)` |
| `workspace_assignments` (20260613000000:9) | `assigned_by` | BIGINT | `users(id)` |
| `user_presence` (20260614000100:6) | `user_id` | BIGINT | `users(id)` |
| `permission_requests` (MISSING_TABLES_MIGRATION.sql:76,78) | `user_id`, `requested_by` | TEXT | `users(id)` |
| `system_roles` (SYSTEM_ROLES_MIGRATION.sql:4) | `user_id` | UUID | - (no FK) |

**Critical FK Issues:**
- `workspace_assignments` and `user_presence` assume `users.id` is BIGINT
- `user_roles`, `audit_logs`, `dashboard_widgets` assume `users.id` is TEXT
- These cannot coexist - FK violations will occur

---

## 4. ID Conversions in Frontend

### parseInt Operations (workspaceService.ts)
```typescript
parseInt(userId)           // Lines 57, 71, 85, 117, 118, 119, 146, 158, 175, 197, 198, 276, 292
parseInt(workbookId)       // Lines 95, 118, 119, 198, 293
parseInt(assignedBy)       // Line 119
parseInt(assignmentId)     // Line 146
```

### toString Operations
```typescript
String(u.id)               // workspaceService.ts:39 - getAssignableUsers
String(u.id)               // worksheetService.ts:72 - column id conversion
appUser?.id?.toString()    // DashboardBuilder.tsx:304 - created_by for widget
parseInt(payload.user_id)  // workspaceService.ts:348 - createRecordNote
parseInt(payload.sheet_id) // workspaceService.ts:349
parseInt(payload.workbook_id) // workspaceService.ts:350
```

### Implicit Assumptions
| Location | Assumption |
|----------|------------|
| `authHelper.ts:99` | `user.id as number` - casts directly to number |
| `user_roles` queries | Treat `user_id` as number (lines 50, 75, 224) |
| `workspace_assignments` queries | Treat `user_id` as BIGINT via parseInt |
| `user_presence` queries | Treat `user_id` as number (presenceService.ts:87) |

---

## 5. Mismatches Summary

| Component | Frontend Type | Database Type (Primary) | Status |
|-----------|---------------|-------------------------|--------|
| `users.id` | number / string | TEXT (SUPABASE_SCHEMA) vs UUID (AUTH_MIGRATION) | ❌ CONFLICT |
| `user_roles.user_id` | number | TEXT | ❌ MISMATCH |
| `audit_logs.user_id` | number | TEXT | ❌ MISMATCH |
| `dashboard_widgets.user_id` | string | TEXT | ✅ MATCH |
| `dashboard_widgets.created_by` | string | TEXT | ✅ MATCH |
| `workspace_assignments.user_id` | number (after parseInt) | BIGINT | ❌ MISMATCH |
| `user_presence.user_id` | number | BIGINT | ❌ MISMATCH |
| `permission_requests.user_id` | string | TEXT | ✅ MATCH |
| `system_roles.user_id` | - | UUID | ✅ (no FK) |

---

## 6. Risk Level Assessment

| Risk Level | Count | Tables/Areas |
|------------|-------|--------------|
| 🔴 CRITICAL | 5 | `user_roles`, `audit_logs`, `workspace_assignments`, `user_presence`, `users` (type conflict) |
| ⚠️ HIGH | 2 | `workspace_notes`, RLS policies using `auth.uid()` |
| 🟡 MEDIUM | 3 | `dashboard_widgets` (FK not working), `system_roles` (no FK), mixed frontend types |

**Critical Failures:**
1. `user_roles` inserts will fail if `users.id` is UUID (TEXT in schema, BIGINT in workspace)
2. `workspace_assignments` inserts will fail if `users.id` is TEXT or UUID
3. `user_presence` inserts will fail with any non-BIGINT `users.id`
4. RLS policies using `auth.uid()` will never match `users.id TEXT`

---

## 7. Recommended Canonical Type

Based on analysis:

| Recommendation | Rationale |
|----------------|-----------|
| **TEXT** (without FK constraints initially) | - Matches `SUPABASE_SCHEMA.sql` (widely used) |
| | - Supabase `auth.uid()` returns TEXT |
| | - Current frontend `userService` already uses string |
| | - Allows easier transition from numeric to string IDs |

### Migration Path:

1. **Phase 1 - Remove FK constraints temporarily:**
```sql
-- Remove FK constraints that expect BIGINT
ALTER TABLE public.workspace_assignments DROP CONSTRAINT IF EXISTS workspace_assignments_user_id_fkey;
ALTER TABLE public.user_presence DROP CONSTRAINT IF EXISTS user_presence_user_id_fkey;
```

2. **Phase 2 - Frontend unification:**
- Change `authHelper.ts` `id: number` → `id: string`
- Remove `parseInt()` calls in `workspaceService.ts` and `roleService.ts`
- Use `String()` or direct values consistently

3. **Phase 3 - Re-add FK constraints:**
```sql
-- After confirming all values are TEXT
ALTER TABLE public.workspace_assignments ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.workspace_assignments ALTER COLUMN assigned_by TYPE TEXT;
ALTER TABLE public.user_presence ALTER COLUMN user_id TYPE TEXT;
```

---

## 8. Key Decision Points

| Question | Options | Recommendation |
|----------|---------|----------------|
| What is actual `users.id` type in Supabase? | TEXT or UUID | Verify via `SELECT pg_typeof(id) FROM users LIMIT 1` |
| Should we enforce FK constraints? | Yes/No | Yes, but only after type alignment |
| Primary key format? | BIGINT, TEXT, or UUID | TEXT (for auth.uid() compatibility) |
| Handle existing numeric IDs? | Migrate or support both | Support TEXT, let frontend adapt |

---

## 9. Files Requiring Changes

| File | Change Type |
|------|-------------|
| `frontend/src/services/authHelper.ts` | Type: `id: number` → `id: string` |
| `frontend/src/services/presenceService.ts` | Type: `user_id: number` → `user_id: string` |
| `frontend/src/services/workspaceService.ts` | Remove `parseInt()` on user_id |
| `frontend/src/services/roleService.ts` | Remove `parseInt(userId)` |
| `supabase/migrations/*.sql` | Align FK types with chosen canonical type |