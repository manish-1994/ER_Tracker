# Presence System Audit

## Date: 2026-06-18

---

## 1. Does public.user_presence exist in Supabase?

**Status: Unknown - Not verified in actual database**

Migration `20260614000100_create_user_presence.sql` defines the table, but:
- Migration was created but application status unknown
- Multiple conflicting migration definitions exist (BIGINT vs UUID vs INTEGER)
- No verification query has been run against live Supabase

### Migration Definitions

| Migration File | user_id Type | workbook_id Type | Notes |
|----------------|-------------|-----------------|-------|
| `20260614000100_create_user_presence.sql` | BIGINT | BIGINT | Lines 6, 10 - FK references `users(id)`, `workbooks(id)` |
| `MISSING_TABLES_MIGRATION.sql` | INTEGER | INTEGER | Lines 29, 33 - No FK constraints |
| `SUPABASE_SCHEMA.sql` (planned) | Not defined | Not defined | Only has dashboard_widgets, no user_presence |

**Critical:** The two migration definitions are incompatible. Cannot apply both without conflict.

---

## 2. Is user_presence required for current functionality?

**Decision: OPTIONAL FEATURE - Graceful disable recommended**

### Integration Points

| Component | Usage | Impact if Disabled |
|-----------|-------|------------------|
| `presenceService.ts` | Core tracking service with localStorage fallback | None - gracefully falls back to localStorage |
| `MainLayout.tsx` (lines 9, 79, 111, 115) | Calls `trackUserPresence()` on activity, `clearUserPresence()` on logout | UI still functions, just no cross-tab presence |
| `UserPresence.tsx` | Displays online/offline user status, workbook viewers | Page accessible but shows only local storage users |
| `AuthContext.tsx` | No direct usage | N/A |
| Route Guard (App.tsx:160) | Requires `view_user_presence` permission | Users without permission already redirected |

### Feature Analysis

- **Primary UI:** `/user-presence` page (CyberStatCard dashboard showing online/idle/offline users)
- **Secondary UI:** Navigation link in sidebar for users with `view_user_presence` permission
- **Tracking:** Continuous presence updates on mouse/keydown/click/scroll events
- **Purpose:** Monitoring active users and workbook access (admin/supervisor tool)

---

## 3. Current Issues

### 3.1 Schema Conflict with users.id

The `user_presence.user_id` column type conflicts with `users.id` across migrations:

| users.id (from migrations) | user_presence.user_id (from migrations) |
|----------------------------|----------------------------------------|
| TEXT (`SUPABASE_SCHEMA.sql` line 66) | BIGINT (`20260614000100` line 6) |
| UUID (`DATABASE_AUTH_MIGRATION.sql` line 5) | INTEGER (`MISSING_TABLES` line 29) |

**Result:** FK constraint `user_presence.user_id → users.id` will fail if types mismatch.

### 3.2 No Retry Loops Detected

The `presenceService.ts` does NOT have retry loops. It uses a single `isTableAvailable` flag (line 14) that disables DB calls after first failure. However:

- `console.warn` on line 51 fires once per session (acceptable)
- No exponential backoff or repeated polling found

### 3.3 Console Spam Prevention

Current implementation prevents spam:
- `isTableAvailable = false;` disables future DB attempts (lines 43, 52, 118, 127)
- Falls back to localStorage silently after first error
- **BUT:** The `sheets` query in MainLayout.tsx line 69 has no error handling, causing console errors when workbook_id lookup fails.

---

## 4. Recommendations

### Option A: Disable Gracefully (Recommended)

Since the feature is optional and has working localStorage fallback:

1. **Modify `presenceService.ts`:**
   - Set `isTableAvailable = false` by default
   - Skip DB attempts entirely
   - Remove Supabase channel subscription (currently unused if table missing)

2. **Update sidebar link:**
   - `MainLayout.tsx` line 128: `showUserPresence` already gated by permission check
   - No changes needed unless removing feature entirely

3. **No RLS policies needed** - localStorage-only operation

### Option B: Create Correct Migration

If feature is required:

```sql
-- Create unified user_presence table matching TEXT users.id schema
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id TEXT PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('online','idle','offline')),
    current_page TEXT,
    current_workbook_id TEXT,
    session_start TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen);

-- Disable RLS for custom auth compatibility
ALTER TABLE public.user_presence DISABLE ROW LEVEL SECURITY;
```

**Note:** Use TEXT for all ID columns to align with `users.id` TEXT type (SUPABASE_SCHEMA.sql line 66).

---

## 5. Code Locations Summary

| File | Line | Purpose | Action |
|------|------|---------|--------|
| `frontend/src/services/presenceService.ts` | 14 | `isTableAvailable` flag | Already handles graceful fallback |
| `frontend/src/services/presenceService.ts` | 31 | `supabase.from("user_presence")` | Falls back to localStorage on error |
| `frontend/src/services/presenceService.ts` | 87 | `clearUserPresence` delete | Catches errors silently |
| `frontend/src/services/presenceService.ts` | 111 | `getPresences` select | Falls back to localStorage |
| `frontend/src/services/presenceService.ts` | 158-167 | Realtime subscription | Will fail gracefully if table missing |
| `frontend/src/layouts/MainLayout.tsx` | 80 | `trackUserPresence` call | Has no error handling |
| `frontend/src/layouts/MainLayout.tsx` | 69-77 | `sheets` table query for workbook_id | No error handling, causes console spam |
| `frontend/src/pages/UserPresence.tsx` | 31 | `getPresences()` call | Falls back to localStorage |

---

## 6. Verification Query

Run in Supabase SQL Editor to verify actual schema:

```sql
-- Check if user_presence exists and its structure
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'user_presence'
) AS exists;

-- Check users.id type if user_presence exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_presence';
```

---

## 7. Decision

**Recommended Action:** Disable database presence tracking gracefully.

The system already has:
- LocalStorage fallback working
- `isTableAvailable` flag preventing retry spam
- Permission gates preventing unauthorized access

**Actions Completed:**
- Set `isTableAvailable = false` in `presenceService.ts` (line 15) - skips DB calls
- Changed `UserPresence` interface to use `string` types for `user_id` and `current_workbook_id` (lines 4,8)
- Changed `trackUserPresence`, `clearUserPresence` parameters to `string` (lines 22,86)
- Added early return in `clearUserPresence` when table unavailable (line 87)
- Updated `MainLayout.tsx` to pass `String(appUser.id)` to presence functions (lines 82, 117)
- Added comment to `sheets` query catch block in MainLayout.tsx (line 76)

**Remaining Action Required:**
- Ensure `user_presence` table does NOT exist in Supabase (localStorage fallback active)
- OR apply correct TEXT-based migration if feature is needed in future