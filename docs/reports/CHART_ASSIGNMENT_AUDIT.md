# CHART_ASSIGNMENT_AUDIT.md

---

## 1. STORAGE TABLE

**Table**: `localStorage` (browser client-side storage)

**Key**: `dashboard_assignments`

**Location**: `frontend/src/pages/DashboardBuilder.tsx:293-296`

```ts
const raw = localStorage.getItem("dashboard_assignments");
const parsed = raw ? JSON.parse(raw) : {};
parsed[selectedUserId] = updated;
localStorage.setItem("dashboard_assignments", JSON.stringify(parsed));
```

No database table stores chart assignments. All widget configurations are persisted locally in the browser.

---

## 2. ASSIGNMENT FIELD

**Field Used**: `user.id` (numeric UUID/number from `users` table)

**Source**: `selectedUserId` from user dropdown (DashboardBuilder.tsx:56, 361)

**Users Retrieved Via**: `userService.getUsers()` (DashboardBuilder.tsx:77)

The `getUsers()` function returns `id`, `username`, and `roles` from the `users` table.

---

## 3. SAVE LOGIC

**File**: `frontend/src/pages/DashboardBuilder.tsx:254-310`

**Process**:
1. User selects a target user from dropdown
2. `selectedUserId` is stored in component state (line 56)
3. On save, widget config added to `assignedWidgets` array (line 289)
4. `localStorage` updated with `parsed[selectedUserId] = updated` (lines 293-296)

**Key Issue**: Assignment key is `selectedUserId` which is a string representation of `u.id` (numeric)

---

## 4. DASHBOARD RETRIEVAL LOGIC

**File**: `frontend/src/pages/Dashboard.tsx:60-73`

```ts
const raw = localStorage.getItem("dashboard_assignments");
if (raw) {
  try {
    const parsed = JSON.parse(raw);
    const userWidgets = parsed[appUser.id] || [];
    setWidgets(userWidgets);
  } catch (e) {
    console.error("Failed to parse user dashboard widgets:", e);
  }
}
```

**Issue**: `appUser.id` comes from `localStorage` (authHelper.ts:105) and is stored as a number when logged in, but the key in localStorage is stored as a string.

---

## 5. RLS POLICIES

**RLS Policies**: Located in `docs/archive/SUPABASE_RLS.sql`

**Relevant Tables**:
- `users` - No RLS policies defined (public access implied)
- No RLS policies exist for `dashboard_assignments` (it's localStorage, not a database table)

The chart widget data is retrieved via `rowService.getRows()` which queries dynamic `records_<uuid>` tables with RLS policies inherited from parent worksheet/workbook.

---

## 6. USER IDENTIFIER FORMAT

**Auth Flow** (`authHelper.ts:81-107`):
- `loginUser()` fetches user by `username` (line 85)
- Returns `AppUser` with numeric `id` field
- Stores to localStorage: `localStorage.setItem("appUser", JSON.stringify(sessionUser))` (line 105)

**Assignment Storage** (`DashboardBuilder.tsx:293-296`):
- Uses `selectedUserId` directly as key (string from dropdown value)

**Retrieval** (`Dashboard.tsx:66-67`):
- Uses `appUser.id` directly as key

---

## 7. ROOT CAUSE

**Primary Issue**: localStorage is browser-local and user-isolated.

1. When Admin creates widgets for User B, they are saved to Admin's browser localStorage under User B's ID key
2. User B cannot see these widgets when logging in from their own browser/device because:
   - User B's localStorage is empty (never written to)
   - localStorage does not sync between browsers, users, or devices
   - Each user session has isolated localStorage

**Secondary Issue**: Type mismatch between number and string for user IDs (minor - both should work as keys)

**No RLS Issue**: Since all data is stored in localStorage, Supabase RLS policies are irrelevant for widget visibility.

---

## 8. RECOMMENDED FIX

**Option A: Migrate to Supabase Database Table**

Create `dashboard_widgets` table:
```sql
create table public.dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  title text,
  type text,
  workbook_id uuid,
  sheet_id uuid,
  config jsonb,
  created_by uuid,
  created_at timestamp default now()
);
```

Add RLS policy:
```sql
create policy dashboard_widgets_select on public.dashboard_widgets 
  for select using (user_id = auth.uid());
create policy dashboard_widgets_insert on public.dashboard_widgets 
  for insert with check (created_by = auth.uid());
```

Modify DashboardBuilder.tsx to save to Supabase instead of localStorage.

**Option B: Sync localStorage via API**

Create backend endpoint that serves widget assignments per user, eliminating localStorage dependency.

**Option C: Use Supabase Realtime/Broadcast**

Store assignments in a shared location accessible to all users (requires database).

---

*Generated on 2026-06-17.*