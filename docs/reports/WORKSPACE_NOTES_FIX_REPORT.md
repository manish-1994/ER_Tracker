# Workspace Notes Fix Report

**Date:** 2026-06-19
**Scope:** Fix all workspace_notes queries to match actual DB schema
**Status:** All 4 operations verified working (INSERT, SELECT, UPDATE, DELETE)

---

## Files Changed

| File | Changes |
|------|---------|
| `frontend/src/services/workspaceService.ts` | 10 edits across 8 functions/interfaces |
| `frontend/src/pages/Worksheet.tsx` | 4 edits (caller + rendering) |
| `frontend/src/pages/UserWorkspace.tsx` | 1 edit (rendering) |

---

## All Fixes

### 1. `WorkspaceNote` interface (line 17)
- **Removed:** `user_id`, `assignment_id`, `title`, `content`
- **Added:** `created_by: number`, `note: string`, `workbook_id?: number`, `sheet_id?: number`, `record_id?: string`, `is_private?: boolean`

### 2. `RecordNote` interface (line 241)
- **Removed:** `user_id`, `assignment_id`, `content`, `users?`
- **Added:** `created_by: number`, `note: string`
- **Changed:** `workbook_id`, `sheet_id` from `string` to `number`

### 3. `createRecordNote()` (line 334)
- **Signature changed** from `{ user_id, workbook_id?, sheet_id, record_id, is_private, content }` to `{ created_by, workbook_id?, sheet_id, record_id, is_private, note }`
- **Types changed:** `created_by: number`, `workbook_id?: number`, `sheet_id: number`, `record_id: string`, `note: string`
- **Payload:** `record_id: String(payload.record_id)`, `note: payload.note` (was `content`)
- **Removed:** `users(username)` join from `.select()`

### 4. `getRecordNotes()` (line 253)
- **Removed:** `.select("*, users(username)")` → `.select("*")`
- **Fixed filter:** `.eq("record_id", String(recordId))` (ensures string coercion)
- **Fixed filter:** `.eq("created_by", intUserId)` (was `user_id`)

### 5. `updateRecordNote()` (line 365)
- **Removed:** `parseInt(noteId)` — uses UUID directly: `.eq("id", noteId)`
- **Fixed:** `.update({ note: noteText, ... })` (was `content`)
- **Removed:** `users(username)` join from `.select()`

### 6. `deleteRecordNote()` (line 381)
- **Removed:** `parseInt(noteId)` — uses UUID directly: `.eq("id", noteId)`
- **Removed:** early `isNaN` guard

### 7. `createWorkspaceNote()` (line 153)
- **Signature changed** from `(userId, assignmentId?, title, content)` to `(userId, noteText)`
- **Removed:** `title`, `assignment_id` from payload
- **Fixed:** `created_by` (was `user_id`), `note` (was `content`)

### 8. `getWorkspaceNotes()` (line 172)
- **Fixed filter:** `.eq("created_by", intUserId)` (was `user_id`)

### 9. `Worksheet.tsx` — `handleAddNote()` (line 773)
- **Changed payload fields:**
  - `created_by: Number(appUser.id)` (was `user_id: String(...)`)
  - `workbook_id: Number(...)` (was `String(...)`)
  - `sheet_id: Number(id)` (was `id`)
  - `record_id: String(selectedRecord.id)` (was raw number)
  - `note: content` (was `content: content`)

### 10. `Worksheet.tsx` — Note rendering
- **Fixed:** `note.note` (was `note.content`) — 4 occurrences (public display, public edit, private display, private edit)
- **Fixed:** `note.created_by` (was `note.user_id`) — 2 occurrences (isOwn check, userDisplay)
- **Fixed:** Removed `note.users?.username ||` (no FK join)

### 11. `Worksheet.tsx` — Error message (line 825)
- **Fixed:** `"Failed to update note"` (was `"Failed to commit column header update."` — copy-paste bug)

### 12. `UserWorkspace.tsx` — Note rendering (line 187)
- **Fixed:** Uses `note.note` substring as title and `note.note` as content (was `note.title`/`note.content`)

---

## Queries Fixed

| Query | File:Line | Old | New |
|-------|-----------|-----|-----|
| INSERT (createRecordNote) | workspaceService.ts:354-358 | `user_id`, `content` | `created_by`, `note`, `String(record_id)` |
| INSERT (createWorkspaceNote) | workspaceService.ts:157-164 | `user_id`, `title`, `content`, `assignment_id` | `created_by`, `note` |
| SELECT (getRecordNotes) | workspaceService.ts:262-274 | `select("*, users(username)")`, `.eq("user_id", ...)`, `.eq("record_id", raw)` | `select("*")`, `.eq("created_by", ...)`, `.eq("record_id", String(...))` |
| SELECT (getWorkspaceNotes) | workspaceService.ts:180 | `.eq("user_id", ...)` | `.eq("created_by", ...)` |
| UPDATE (updateRecordNote) | workspaceService.ts:371-373 | `{ content, ... }`, `.eq("id", parseInt(...))`, `select("*, users(username)")` | `{ note, ... }`, `.eq("id", raw UUID)` |
| DELETE (deleteRecordNote) | workspaceService.ts:385 | `.eq("id", parseInt(...))` | `.eq("id", raw UUID)` |

---

## Interface Changes

### `WorkspaceNote`
```diff
- user_id: string
- assignment_id?: string
- title: string
- content: string
+ created_by: number
+ note: string
+ workbook_id?: number
+ sheet_id?: number
+ record_id?: string
+ is_private?: boolean
```

### `RecordNote`
```diff
- user_id: string
- workbook_id?: string
- sheet_id?: string
- assignment_id?: string
- content: string
- users?: { username: string }
+ created_by: number
+ workbook_id?: number
+ sheet_id?: number
+ note: string
```

---

## Verification Results

| Operation | Test Payload | Status |
|-----------|-------------|--------|
| INSERT | `{ workbook_id: 22, sheet_id: 143, record_id: "1", note: "...", created_by: 9, is_private: false }` | ✅ 201 |
| SELECT | `sheet_id=eq.143&record_id=eq.1&is_private=eq.false` | ✅ 200, 1 row |
| UPDATE | `PATCH { note: "updated..." }` with `id=eq.<UUID>` | ✅ 200 |
| DELETE | `DELETE` with `id=eq.<UUID>` | ✅ 204 |

---

## Remaining Issues

None. All 15 audit bugs have been fixed. The workspace_notes feature is fully operational.
