# Public Note → Empty Record Details: Root Cause Analysis

**Date:** 2026-06-19
**Mode:** Read-only audit — no code modified

---

## Summary

Two independent bugs cause clicking a Public Note to result in an empty/no-op state:

### Bug A: Auto-open effect is incomplete (PRIMARY)
The deep-link auto-open effect in `Worksheet.tsx:357-370` opens the drawer but **omits two critical calls** that `openRecordDetail()` always makes. The Notes tab shows "No notes yet" because notes are never fetched.

### Bug B: Record table does not exist for sheet 148
Public notes reference `sheet_id=148` (Redflag_1), but **no corresponding record table exists** in the database. `getRows()` returns `[]`, the auto-open finds nothing, and neither the drawer nor a toast activates — the user sees a blank sheet with no feedback.

---

## Trace: workspace_notes.record_id → Route → Params → Row Lookup → Drawer

### Step 1 — Database values

```
workspace_notes row (example):
  id:          79796908-b629-4d2a-8900-e8d1d6654e1c
  workbook_id: 22
  sheet_id:    148
  record_id:   "6"       ← TEXT, stores the record's primary key as a string
  note:        "ETA 6"
  is_private:  false
  created_by:  17
```

**File:** Supabase table `workspace_notes`
**Column type:** `record_id TEXT` (verified via REST API)

### Step 2 — URL generation (UserWorkspace.tsx)

```javascript
// UserWorkspace.tsx:214
window.location.href = `/workbooks/${note.workbook_id}/sheets/${note.sheet_id}/records/${note.record_id}`;
```

| Field | Value | Source |
|-------|-------|--------|
| `note.workbook_id` | `22` | `workspace_notes.workbook_id` |
| `note.sheet_id` | `148` | `workspace_notes.sheet_id` |
| `note.record_id` | `"6"` | `workspace_notes.record_id` (TEXT) |

**Generated URL:** `/workbooks/22/sheets/148/records/6`

### Step 3 — Route params received (Worksheet.tsx:36-38)

```javascript
const params = useParams<{ id: string; workbookId: string; sheetId: string; recordId: string }>();
const id = params.sheetId || params.id;        // "148"
const targetRecordId = params.recordId;         // "6"
```

| Param | Value | Type |
|-------|-------|------|
| `params.workbookId` | `"22"` | string |
| `params.sheetId` | `"148"` | string |
| `params.recordId` | `"6"` | string |
| `id` (effective sheet ID) | `"148"` | string |

✅ Params resolve correctly.

### Step 4 — Row loading (rowService.ts:159-192)

```javascript
export const getRows = async (worksheetId: string): Promise<Row[]> => {
  const tableName = await resolveRecordTable(worksheetId);  // "records_148"
  ...
  const { data, error, status } = await supabase.from(tableName).select("*");
  if (error.code === "42P01" || status === 404) {
    const localData = localStorage.getItem(`local_rows_${worksheetId}`);
    return localData ? JSON.parse(localData) : [];  // returns []
  }
  ...
};
```

`resolveRecordTable("148")` resolves to `"records_148"` because:
1. Sheet 148 has 12 columns in the `columns` table → probe logic activates
2. Probe checks all 18 UUID-named record tables for matching columns → **none match**
3. Not in `SHEET_TO_RECORD_TABLE` static map (which ends at sheet 141)
4. Falls back to `records_148`

**Result:** `records_148` returns 404 → `getRows` returns `[]` → `localRows = []`

### Step 5 — Auto-open effect (Worksheet.tsx:357-370)

```javascript
useEffect(() => {
  if (!targetRecordId || autoOpenAttempted || isRowsLoading) return;     // false
  const found = localRows.find(r => String(r.id) === targetRecordId);    // undefined
  if (found) {
    setSelectedRecord(found);      // ❌ never reached
    setDetailOpen(true);
    setDrawerTab("notes");
    setAutoOpenAttempted(true);
  } else if (!isRowsLoading && localRows.length > 0) {                   // false (length === 0)
    toast.error("Record no longer exists");
    setAutoOpenAttempted(true);    // ❌ never reached
  }
}, [targetRecordId, localRows, isRowsLoading, autoOpenAttempted]);
```

**Neither branch fires.** `autoOpenAttempted` stays `false`. No drawer opens. No toast shows.

| Check | Value | Outcome |
|-------|-------|---------|
| `targetRecordId` | `"6"` | truthy → continue |
| `autoOpenAttempted` | `false` | → continue |
| `isRowsLoading` | `false` | → continue |
| `found` | `undefined` | → skip `if (found)` |
| `localRows.length > 0` | `0` | `false` → skip `else if` |
| Result | — | **No branch matched** |

### Step 6 — Drawer state

**Drawer remains closed.** `setDetailOpen(true)` is never called.

---

## Root Cause Breakdown

### Bug A: Auto-open effect incomplete (Worksheet.tsx:361-365)

When a record IS found, the effect sets three states but **omits two** that `openRecordDetail` always sets:

| State | `openRecordDetail()` | Auto-open effect | Missing? |
|-------|---------------------|------------------|----------|
| `setSelectedRecord(row)` | ✅ | ✅ | |
| `setDetailEditValues(row.data \|\| {})` | ✅ | ❌ | **YES** |
| `setDrawerTab("details"/"notes")` | ✅ | ✅ | (set to "notes") |
| `setDetailOpen(true)` | ✅ | ✅ | |
| `fetchRecordNotesAndTimeline(row.id)` | ✅ | ❌ | **YES** |

**The Notes tab shows "No public notes yet" / "No private notes yet" because `fetchRecordNotesAndTimeline` is never called.**

**The Details tab shows empty fields because `setDetailEditValues` is never called.**

### Bug B: Record table `records_148` does not exist

| Check | Value |
|-------|-------|
| Sheet ID in note | `148` |
| Sheet name | "Redflag_1" |
| SHEET_TO_RECORD_TABLE[148] | `undefined` (map ends at 141) |
| Fallback table name | `records_148` |
| Actual table in DB | **DOES NOT EXIST** |
| `getRows("148")` result | `[]` (404 caught, localStorage empty) |

Without the record table, `localRows` is forever empty, so no record can be found regardless of `record_id`.

### Type coercion check: `workspace_notes.record_id` vs `rows.id`

| Source | Value | Type |
|--------|-------|------|
| `workspace_notes.record_id` | `"6"` | TEXT (string) |
| Record table `rows.id` | `6` | INTEGER (number) |
| Comparison | `String(6) === "6"` | ✅ Correct |

**Type coercion is NOT the issue.** `String(6) === "6"` evaluates to `true`.

### Field match check: `record_id` aligns with `rows.id`

The `record_id` is stored as `String(selectedRecord.id)` in `handleAddNote` (`Worksheet.tsx:795`). The `selectedRecord.id` is the record table's primary key (`rows.id`). A `workspace_notes.record_id` of `"6"` correctly refers to the row with `id=6` in the record table.

**Field alignment is NOT the issue.**

---

## File and Line References

### Worksheet.tsx

| Line | Code | Issue |
|------|------|-------|
| 36-38 | `const params = useParams(...); const id = params.sheetId \|\| params.id; const targetRecordId = params.recordId;` | ✅ Correct |
| 357-370 | Auto-open useEffect | **Bug A** — missing `setDetailEditValues` and `fetchRecordNotesAndTimeline` |
| 362 | `setSelectedRecord(found);` | — |
| 363 | `setDetailOpen(true);` | — |
| 364 | `setDrawerTab("notes");` | — |
| 365 | `setAutoOpenAttempted(true);` | — |
| 366-368 | `else if (!isRowsLoading && localRows.length > 0)` | **Bug B** — `localRows.length > 0` is false when record table is missing; no fallback toast for this case |
| 759-765 | `openRecordDetail()` | Reference implementation — shows the 5 operations that should be mirrored |

### UserWorkspace.tsx

| Line | Code | Issue |
|------|------|-------|
| 212-218 | `handleNoteClick()` | ✅ URL generation is correct |

### rowService.ts

| Line | Code | Issue |
|------|------|-------|
| 159-169 | `getRows()` | ✅ 404/42P01 handled gracefully, returns `[]` |
| 91-157 | `resolveRecordTable()` | **Bug B contributor** — returns `records_148` which doesn't exist |

### rowService.ts:53-87 (SHEET_TO_RECORD_TABLE)

| Key | Value |
|-----|-------|
| Sheets 3..141 | Mapped to UUID-named tables |
| Sheet 148 | **NOT MAPPED** |

---

## Summary of Failing Comparisons

| Comparison | Expected | Actual | Match? |
|-----------|----------|--------|--------|
| `resolveRecordTable("148")` returns valid table | `records_148` or UUID table | `records_148` (404) | ❌ |
| `localRows` non-empty | >= 1 rows | 0 rows | ❌ |
| `localRows.find(r => String(r.id) === "6")` | finds row `{id: 6, ...}` | `undefined` | ❌ |
| `isRowsLoading` when data resolved | `false` | `false` | ✅ (but still empty) |
| `localRows.length > 0` (in else-if) | `true` | `false` | ❌ |
| Toast shown to user | ✅ shown | ❌ never shown | ❌ |
| Drawer opens | ✅ opens | ❌ stays closed | ❌ |

---

## Recommended Fix

### Fix A — Complete the auto-open effect (Worksheet.tsx:361-365)

Add the two missing operations after `setSelectedRecord(found)`:

```javascript
// After line 362:
setDetailEditValues(found.data || {});
fetchRecordNotesAndTimeline(found.id);
```

### Fix B — Handle empty localRows in auto-open effect (Worksheet.tsx:369)

Add a third branch for when data has finished loading but `localRows` is empty (record table doesn't exist):

```javascript
} else if (!isRowsLoading && localRows.length === 0) {
  toast.error("Record table not found for this sheet");
  setAutoOpenAttempted(true);
}
```

### Fix C (Optional) — Create `records_148` table or update SHEET_TO_RECORD_TABLE

If sheet 148 is expected to have records, either create the `records_148` table with appropriate columns, or add a mapping in `SHEET_TO_RECORD_TABLE`.
