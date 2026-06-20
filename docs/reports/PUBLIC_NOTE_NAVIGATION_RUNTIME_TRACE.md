# Public Note Navigation — Runtime Trace Report

## Summary

The auto-open mechanism for public note navigation **works correctly** after fixing a race condition between the `rows→localRows` sync effect and the auto-open effect. Record #5 **does exist** in the resolved record table and the drawer opens successfully.

---

## Trace Methodology

- URL: `/workbooks/22/sheets/148/records/5`
- Record table for sheet 148: `records_66b58351b75a4f0497478590cc12f7da` (via `SHEET_TO_RECORD_TABLE` mapping)
- Login user: Manish (SuperAdmin, id:9)
- Cache cleared before each run (`localStorage.removeItem("sheet_table_map_148")`)
- Headless Edge via puppeteer-core, 15-second wait for data loads

---

## Execution Trace (chronological)

### Fire #1 — `isRowsLoading: true, localLen: 0`
```
phase: "fire", targetRecordId: "5", autoOpenAttempted: false, isRowsLoading: true, localLen: 0
phase: "earlyReturn", reason: "still loading"
```
Query still in flight → exits early. Correct.

### Fire #2 — still loading
```
phase: "fire", targetRecordId: "5", autoOpenAttempted: false, isRowsLoading: true, localLen: 0
phase: "earlyReturn", reason: "still loading"
```
Same state. Correct.

### Fire #3 — query resolved, race window
```
phase: "fire", targetRecordId: "5", autoOpenAttempted: false, isRowsLoading: false, localLen: 0, rowsLen: 591
```
`isRowsLoading` flipped to `false` but `localLen` is still `0` — the sync effect `rows→setLocalRows` hasn't re-rendered yet.

**Before fix**: `source = localRows = []` → fell into `localRows.length === 0` → "Record table not found" toast + `autoOpenAttempted = true`. The subsequent render with `localLen: 591` was blocked.

**After fix**: `source = rows = [591 items]` → search proceeds on `rows` directly.

```
phase: "source", src: "rows", len: 591, sampleIds: ["1","7","8","9","10"], target: "5"
phase: "find", foundId: "5", found: true
phase: "found"
phase: "afterSetters"
```

**Record #5 was found** (`foundId: "5"`). Note: `sampleIds` are the first 5 records (1,7,8,9,10) — record 5 exists at a later index. All setters executed:
- `setSelectedRecord(found)` ✓
- `setDetailEditValues(found.data || {})` ✓
- `setDetailOpen(true)` ✓
- `setDrawerTab("notes")` ✓
- `fetchRecordNotesAndTimeline(found.id)` ✓
- `setAutoOpenAttempted(true)` ✓

### Fire #4 — already attempted
```
phase: "fire", targetRecordId: "5", autoOpenAttempted: true, isRowsLoading: false, localLen: 591, rowsLen: 591
phase: "earlyReturn", reason: "already attempted"
```
`localLen` now 591 (sync effect caught up). Guard blocks re-entry. Correct.

---

## DOM State Verification (T+15s)

| Check | Result |
|---|---|
| `glassPanel` (drawer panel CSS class) | `true` |
| `fixedRight` (drawer position) | `true` |
| `drawerText` ("Record Details" in innerText) | `true` |
| `recordNoLongerExists` toast | `false` |
| `recordTableNotFound` toast | `false` |

The CyberDrawer component **is rendered and visible**. No error toasts shown.

---

## Root Cause: Race Condition

**Location**: `Worksheet.tsx` lines 352-375 (as of this report)

The component has two adjacent effects:

```typescript
// Effect A (line 352) — sync query data to local state
useEffect(() => {
    if (rows) setLocalRows(rows);
}, [rows]);

// Effect B (line 358) — auto-open on deep-link
useEffect(() => {
    if (!targetRecordId || autoOpenAttempted || isRowsLoading) return;
    const found = localRows.find(r => String(r.id) === targetRecordId);
    // ...
}, [targetRecordId, localRows, isRowsLoading, autoOpenAttempted]);
```

**Timeline in a single React commit**:

1. `useQuery` resolves → `isRowsLoading = false`, `rows = [591 items]`
2. React renders with `localRows = []` (unchanged from previous render)
3. Effect A fires: `if (rows) setLocalRows(rows)` → **schedules** a state update
4. Effect B fires: reads `localRows = []` → falls into "NO ROWS" branch → `setAutoOpenAttempted(true)`
5. React re-renders with `localRows = [591 items]`, `autoOpenAttempted = true`
6. Effect B fires again → `autoOpenAttempted = true` → returns early, never tries to find the record

`setLocalRows(rows)` (Effect A) is a state update that takes effect in the **next** render, but Effect B runs in the **current** render where `localRows` is still empty.

---

## Fix

**File**: `frontend/src/pages/Worksheet.tsx`

**Change**: Added `rows` as a fallback source and added `rows` to the dependency array:

```typescript
useEffect(() => {
    if (!targetRecordId || autoOpenAttempted || isRowsLoading) return;
    // Use rows directly if localRows hasn't synced yet
    const source = localRows.length > 0 ? localRows : (rows || []);
    const found = source.find(r => String(r.id) === targetRecordId);
    if (found) {
        setSelectedRecord(found);
        setDetailEditValues(found.data || {});
        setDetailOpen(true);
        setDrawerTab("notes");
        fetchRecordNotesAndTimeline(found.id);
        setAutoOpenAttempted(true);
    } else if (source.length > 0) {
        toast.error("Record no longer exists");
        setAutoOpenAttempted(true);
    }
}, [targetRecordId, localRows, rows, autoOpenAttempted, isRowsLoading]);
//                                    ^^^^  added
```

When `isRowsLoading` flips to `false`, both `rows` and `isRowsLoading` change in the same commit. The effect reads `rows` directly (591 items), bypasses the stale `localRows`, and successfully finds record #5.

---

## Key Findings

1. **Record #5 exists** in `records_66b58351b75a4f0497478590cc12f7da` — the `SHEET_TO_RECORD_TABLE` mapping for sheet 148 is correct.
2. **The auto-open works** — drawer opens with notes tab selected, note/timeline data fetches.
3. **The race condition was the sole bug** — `localRows` was always empty when the effect first ran after data arrived.
4. **No schema changes needed** — no missing columns, no missing tables, no incorrect types.
5. **The previous "records_148 missing" diagnosis was wrong** — the table exists and contains record #5.

---

## Trace Report Metadata

- Traced at: 2026-06-19
- Build: Verified (`npm run build` succeeds)
- Trace tool: Puppeteer-core v24.43.1 + Edge headless
- Raw logs: `trace_v4_raw.json` (saved alongside this report)
