# Public Notes Record Navigation Report

**Date:** 2026-06-19
**Status:** Complete — build verified

---

## Summary

Clicking a note card in the Public Notes Feed now navigates the user directly to the exact record containing that note, with the Record Details modal open and the Notes tab pre-selected.

---

## Files Changed

| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Added deep-link route |
| `frontend/src/pages/Worksheet.tsx` | Extract route params, auto-open record + notes tab, handle missing records |
| `frontend/src/pages/UserWorkspace.tsx` | Fix click handler, add hover states, quick actions |

---

## Route Architecture

### New deep-link route (App.tsx:93-107)

```
/workbooks/:workbookId/sheets/:sheetId/records/:recordId
```

Added as the first matcher under `/workbooks/` to ensure it takes priority over the generic `/workbooks/:id` route (WorkbookDetail).

Both routes render the same `Worksheet` component:
- `/worksheets/:id` → existing sheet-only view
- `/workbooks/:workbookId/sheets/:sheetId/records/:recordId` → deep-linked record view

### Route param extraction (Worksheet.tsx:36-38)

```typescript
const params = useParams<{ id: string; workbookId: string; sheetId: string; recordId: string }>();
const id = params.sheetId || params.id;
const targetRecordId = params.recordId;
```

- `id` (sheet ID) sourced from either `sheetId` (deep-link) or `id` (legacy route)
- `targetRecordId` extracted from `recordId` param
- Existing logic for `id` remains unchanged

---

## Auto-Open Flow (Worksheet.tsx:357-370)

```typescript
useEffect(() => {
  if (!targetRecordId || autoOpenAttempted || isRowsLoading) return;
  const found = localRows.find(r => String(r.id) === targetRecordId);
  if (found) {
    setSelectedRecord(found);
    setDetailOpen(true);
    setDrawerTab("notes");
    setAutoOpenAttempted(true);
  } else if (!isRowsLoading && localRows.length > 0) {
    toast.error("Record no longer exists");
    setAutoOpenAttempted(true);
  }
}, [targetRecordId, localRows, isRowsLoading, autoOpenAttempted]);
```

### Flow Chart

```
User clicks note card
  → Navigate to /workbooks/{wb}/sheets/{sheet}/records/{record}
  → Worksheet component mounts
  → Sheet data loads
  → Rows data loads
  → useEffect triggers (watches localRows + targetRecordId)
    → Find row where String(row.id) === recordId
      → Found?    → setSelectedRecord(row)
                    setDetailOpen(true)
                    setDrawerTab("notes")
                    setAutoOpenAttempted(true)
      → Not found? → toast.error("Record no longer exists")
                     setAutoOpenAttempted(true)
```

### State: `autoOpenAttempted`

Ensures the auto-open logic fires only once per deep-link navigation. Prevents re-triggering on row updates or re-renders.

---

## Click Handler (UserWorkspace.tsx:212-228)

```typescript
const handleNoteClick = (note: any) => {
  if (note.sheet_id && note.record_id) {
    window.location.href = `/workbooks/${note.workbook_id}/sheets/${note.sheet_id}/records/${note.record_id}`;
  } else if (note.sheet_id) {
    window.location.href = `/worksheets/${note.sheet_id}`;
  } else if (note.workbook_id) {
    window.location.href = `/workspace/workbook/${note.workbook_id}`;
  }
};
```

Falls back gracefully if note has partial data.

---

## Note Card Enhancements (UserWorkspace.tsx)

### Hover State
- Pointer cursor on entire card (`cursor-pointer`)
- Background highlight (`hover:bg-accent/10`)
- Border accent (`hover:border-accent/40`)
- "Open Record →" indicator fades in on hover (top-right corner)

### Quick Actions (fade in on hover)
| Action | Description | Click Behavior |
|--------|-------------|----------------|
| **Copy Record ID** | Copies `record_id` to clipboard | `e.stopPropagation()` prevents navigation |
| **View Workbook** | Navigates to workbook page | `e.stopPropagation()` prevents navigation |

Quick actions are separated by a thin border and only visible on hover (`opacity-0 group-hover:opacity-100`).

---

## Success Criteria

| Criteria | Status |
|----------|--------|
| ✓ Click note → workbook opens | ✅ Navigates to `/workbooks/:wb/sheets/:sheet/records/:record` |
| ✓ Sheet opens | ✅ Route params resolve to sheet ID → Worksheet loads |
| ✓ Record details opens | ✅ `setSelectedRecord(found)`, `setDetailOpen(true)` |
| ✓ Notes tab selected | ✅ `setDrawerTab("notes")` |
| ✓ Existing note visible immediately | ✅ Note fetched via `fetchRecordNotesAndTimeline()` on `selectedRecord` change |
| ✓ Missing record → no crash | ✅ `toast.error("Record no longer exists")` |

---

## Example URL

```
/workbooks/22/sheets/143/records/1
```

This URL:
1. Loads sheet 143 (Fatima April Sheet) from workbook 22 (ER - Weekly Update Sheet.xlsx)
2. Searches for record with id=1 in the record table
3. Opens the Record Details drawer
4. Switches to the Notes tab
5. Fetches and displays all notes for record 1
