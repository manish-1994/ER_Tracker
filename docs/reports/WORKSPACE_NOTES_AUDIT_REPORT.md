# Workspace Notes Audit Report

**Date:** 2026-06-19
**Scope:** Read-only audit of workspace_notes feature
**Status:** 15 bugs found across 2 files

## Actual Database Schema (verified via REST API)

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, auto-generated |
| workbook_id | INTEGER | nullable |
| sheet_id | INTEGER | nullable |
| record_id | TEXT | nullable |
| note | TEXT | nullable |
| is_private | BOOLEAN | nullable |
| created_by | INTEGER | nullable (defaults to NULL) |
| created_at | TIMESTAMPTZ | auto-set |
| updated_at | TIMESTAMPTZ | auto-set |

## Root Cause

The frontend service layer was written for a **different table schema** that no longer exists. Every single read/write operation uses wrong column names. The feature is 100% broken across insert, select, update, and delete.

---

## All Bugs Found

### Bug 1 – `content` should be `note` (INSERT)
- **File:** `frontend/src/services/workspaceService.ts:359`
- **Code:** `content: payload.content`
- **DB column:** `note`
- **Effect:** PGRST204 400 "Could not find the 'content' column" — **this is the error the user sees**

### Bug 2 – `content` should be `note` (UPDATE)
- **File:** `frontend/src/services/workspaceService.ts:386`
- **Code:** `.update({ content, updated_at: new Date().toISOString() })`
- **DB column:** `note`
- **Effect:** PGRST204 400 "Could not find the 'content' column"

### Bug 3 – `user_id` should be `created_by` (INSERT)
- **File:** `frontend/src/services/workspaceService.ts:355`
- **Code:** `user_id: intUserId`
- **DB column:** `created_by`
- **Effect:** Payload column silently ignored, `created_by` set to NULL

### Bug 4 – `user_id` does not exist (SELECT filter, getRecordNotes)
- **File:** `frontend/src/services/workspaceService.ts:278`
- **Code:** `.eq("user_id", intUserId)`
- **DB column:** no `user_id` column exists
- **Effect:** PGRST204 400 "column workspace_notes.user_id does not exist"
- **Covered by:** try/catch returns `[]`, silently swallowing the error

### Bug 5 – `user_id` does not exist (SELECT filter, getWorkspaceNotes)
- **File:** `frontend/src/services/workspaceService.ts:182`
- **Code:** `.eq("user_id", intUserId)`
- **Effect:** Same as Bug 4 — 400 error caught and swallowed

### Bug 6 – `users(username)` join fails (no FK relationship)
- **File:** `frontend/src/services/workspaceService.ts:270`
- **Code:** `.select("*, users(username)")`
- **Effect:** PGRST200 400 "Could not find a relationship between 'workspace_notes' and 'users'" — no foreign key exists between these tables
- The FK would need to be on `created_by → users.id`, but there is no FK defined

### Bug 7 – `parseInt(noteId)` on UUID column (UPDATE)
- **File:** `frontend/src/services/workspaceService.ts:381-382`
- **Code:**
  ```ts
  const intNoteId = parseInt(noteId); // UUID like '5b60650e-...' → 5
  if (isNaN(intNoteId)) return null;  // false
  .eq("id", intNoteId)                // id=eq.5 on UUID column
  ```
- **Effect:** PostgREST returns 400 "invalid input syntax for type uuid: \"5\"" 

### Bug 8 – `parseInt(noteId)` on UUID column (DELETE)
- **File:** `frontend/src/services/workspaceService.ts:397-398`
- **Same as Bug 7 — identical code pattern**

### Bug 9 – `user_id` should be `created_by` (INSERT, createWorkspaceNote)
- **File:** `frontend/src/services/workspaceService.ts:158`
- **Code:** `user_id: parseInt(userId)`
- **DB column:** `created_by`
- **Effect:** Column silently ignored, `created_by` defaults to NULL

### Bug 10 – `title` column does not exist (INSERT, createWorkspaceNote)
- **File:** `frontend/src/services/workspaceService.ts:159`
- **Code:** `title`
- **DB column:** no `title` column
- **Effect:** Ignored by PostgREST, no note text stored

### Bug 11 – `content` should be `note` (INSERT, createWorkspaceNote)
- **File:** `frontend/src/services/workspaceService.ts:160`
- **Code:** `content`
- **DB column:** `note`
- **Effect:** PGRST204 400 "Could not find the 'content' column"

### Bug 12 – `assignment_id` column does not exist (INSERT, createWorkspaceNote)
- **File:** `frontend/src/services/workspaceService.ts:162`
- **Code:** `if (assignmentId) payload.assignment_id = parseInt(assignmentId)`
- **DB column:** no `assignment_id` column
- **Effect:** PGRST204 400 "Could not find the 'assignment_id' column" (when assignmentId is provided)

### Bug 13 – `RecordNote` interface doesn't match DB schema
- **File:** `frontend/src/services/workspaceService.ts:243-257`
- **Fields that don't exist in DB:** `user_id`, `assignment_id`, `content`
- **Fields missing from interface:** `created_by` (INTEGER), `note` (TEXT)
- **Mismatched types:** `workbook_id:string` / `sheet_id:string` (DB is INTEGER)

### Bug 14 – `WorkspaceNote` interface doesn't match DB schema
- **File:** `frontend/src/services/workspaceService.ts:17-25`
- **Fields that don't exist in DB:** `user_id`, `assignment_id`, `title`, `content`
- **Fields missing from interface:** `created_by` (INTEGER), `note` (TEXT), `workbook_id` (INTEGER), `sheet_id` (INTEGER), `record_id` (TEXT), `is_private` (BOOLEAN)

### Bug 15 – Wrong error message in update handler
- **File:** `frontend/src/pages/Worksheet.tsx:825`
- **Code:** `toast.error("Failed to commit column header update.")`
- **Should be:** `toast.error("Failed to update note")` — copy-paste bug

---

## Type Mismatch Analysis

| Payload field | Runtime type | DB column | DB type | Coercion? |
|--------------|-------------|-----------|---------|-----------|
| `record_id` | number | `record_id` | TEXT | ✅ INSERT coerces, ❌ eq filter does NOT |
| `user_id` (Bug 3/9) | number | `created_by` | INTEGER | ✅ but column name is wrong |
| `workbook_id` | number | `workbook_id` | INTEGER | ✅ |
| `sheet_id` | number | `sheet_id` | INTEGER | ✅ |
| `is_private` | boolean | `is_private` | BOOLEAN | ✅ |
| `content` (Bug 1/2/11) | string | `note` | TEXT | ❌ column name is wrong |

**Key insight:** `record_id` is sent as a NUMBER (from `selectedRecord.id` which is the record table's integer PK), but the DB stores it as TEXT. PostgREST coerces on INSERT (saves `1` as `"1"`), but the `.eq("record_id", recordId)` filter fails silently because PostgREST doesn't coerce for equality filters. This affects `getRecordNotes` (line 272).

---

## RLS Policy Check

Insert/select/update/delete all work with the anon key when using correct column names. RLS is either not enabled on this table or allows public access. RLS is **not** the cause of any errors.

---

## Full File: Line-by-Line Breakdown

### `frontend/src/services/workspaceService.ts`

| Lines | Function | Bugs |
|-------|----------|------|
| 17-25 | `WorkspaceNote` interface | 14 (complete schema mismatch) |
| 151-172 | `createWorkspaceNote()` | 9, 10, 11, 12 |
| 174-190 | `getWorkspaceNotes()` | 5 (user_id filter fails) |
| 243-257 | `RecordNote` interface | 13 (complete schema mismatch) |
| 259-286 | `getRecordNotes()` | 4 (user_id filter), 6 (users join), 7 (eq filter coercion on record_id) |
| 340-375 | `createRecordNote()` | 1 (content→note), 3 (user_id→created_by) |
| 377-394 | `updateRecordNote()` | 2 (content→note), 7 (parseInt on UUID) |
| 396-405 | `deleteRecordNote()` | 8 (parseInt on UUID) |

### `frontend/src/pages/Worksheet.tsx`

| Lines | Function | Bugs |
|-------|----------|------|
| 765-803 | `handleAddNote()` | passes `selectedRecord.id` (number) as `record_id` — type coercion issue on SELECT |
| 806-827 | `handleUpdateNote()` | 15 (wrong error message) |
| 830-847 | `handleDeleteNote()` | calls `deleteRecordNote` which has Bug 8 |

---

## Verification Summary

| Action | SQL operation | Works? | Error |
|--------|------|--------|-------|
| Add public note | INSERT | ❌ | 400 "content" column not found |
| Add private note | INSERT | ❌ | Same — uses same `createRecordNote` |
| Fetch public notes | SELECT | ❌ | 400 "user_id" column not found |
| Fetch private notes | SELECT | ❌ | 400 "user_id" column not found + join fails |
| Edit note | UPDATE | ❌ | 400 "content" column not found + parseInt/UUID |
| Delete note | DELETE | ❌ | parseInt/UUID mismatch |

**Every action is broken.** Zero workspace_notes operations succeed.
