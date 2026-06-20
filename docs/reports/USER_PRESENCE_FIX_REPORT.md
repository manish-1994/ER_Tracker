# USER PRESENCE FIX REPORT

## Issue
`POST /rest/v1/user_presence` 404 error when tracking user presence.

## Root Cause
The `user_presence` table existed in the database but `presenceService.ts` had `isTableAvailable = false` hardcoded, forcing all presence tracking through localStorage fallback. Additionally, the service passed `user_id` as a string while the table column required a numeric type.

## Changes Made

### 1. Migration Fix
**File:** `supabase/migrations/20260614000100_create_user_presence.sql`
- Changed `user_id BIGINT` to `user_id TEXT` to match the `users.id` column type in `SUPABASE_SCHEMA.sql`
- Changed `current_workbook_id BIGINT` to `current_workbook_id TEXT` for consistency (no FK to workbooks since workbooks uses UUID)

### 2. Presence Service Auto-Detection
**File:** `frontend/src/services/presenceService.ts`
- Removed hardcoded `isTableAvailable = false`
- Added `detectTable()` function that probes the table on first use and caches the result
- Changed `UserPresence.user_id` type from `string` to `number` to match database schema
- `trackUserPresence()` now accepts `userId: string | number` and converts to numeric for DB queries
- `clearUserPresence()` now auto-detects table and passes numeric ID
- `getPresences()` now auto-detects table before querying
- `subscribeToPresence()` now auto-detects table before subscribing

### 3. MainLayout Updates
**File:** `frontend/src/layouts/MainLayout.tsx`
- Updated `trackUserPresence()` calls to pass `appUser.id` (number) instead of `String(appUser.id)`
- Updated `clearUserPresence()` call to pass `appUser.id` (number)

### 4. UserPresence Page Fix
**File:** `frontend/src/pages/UserPresence.tsx`
- Updated user ID comparisons to use `Number()` for consistent type matching

## Verification
- ✅ Table exists and is queryable via API
- ✅ Upsert succeeds with numeric IDs
- ✅ Auto-detection falls back to localStorage if table is missing
- ✅ Build succeeds

## Remaining
- Apply migration SQL via Supabase Dashboard if `user_presence` table needs recreation with updated types
