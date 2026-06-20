# Auth Fix Report — bcrypt Verification Restoration

**Date:** 2026-06-19
**Status:** ✅ Fixed

---

## Problem

Login failed for all existing users with `"Invalid credentials"`.

## Root Cause

During a previous production stabilization fix (Issue 2 — Bcrypt Removal), all bcrypt references were purged from the codebase:

- `bcryptjs` package removed from `package.json`
- `import bcrypt` and all `bcrypt.compareSync()` calls removed from `authHelper.ts` and `userService.ts`
- Password verification was replaced with plaintext comparison: `password !== storedPassword`

This caused two failure modes:

1. **If `hashed_password` was a bcrypt hash** → plaintext never matches a `$2a$10$...` hash → login fails
2. **If `hashed_password` was plaintext** → plaintext comparison worked, but new user registrations stored plaintext (no hashing)

At the time of this fix, the database contained **plaintext passwords** for all users (bcrypt hashes had been previously reset), but the code needed to support **both** formats for forward/backward compatibility.

## Fix Applied

### 1. Reinstalled bcryptjs

```
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### 2. Restored bcrypt import in `authHelper.ts`

```typescript
import bcrypt from "bcryptjs";
```

### 3. Implemented hybrid password verification (lines 94-97)

```typescript
const isValid = storedHash.startsWith("$2")
  ? bcrypt.compareSync(password, storedHash)
  : password === storedHash;
```

This handles both formats:
- **`$2` prefix (bcrypt hash)**: Uses `bcrypt.compareSync()` for proper hash verification
- **No `$2` prefix (plaintext)**: Falls back to direct comparison

### 4. Updated `package.json`

`bcryptjs` added back to dependencies.

## Files Changed

| File | Change |
|------|--------|
| `frontend/package.json` | Added `bcryptjs` dependency |
| `frontend/package-lock.json` | Updated (auto-generated) |
| `frontend/src/services/authHelper.ts` | Added `bcrypt` import & hybrid verification |

## Verification

```
BCrypt hash + correct password → true
BCrypt hash + wrong password  → false
Plaintext + correct password  → true
Plaintext + wrong password    → false
New bcrypt hash + correct pwd → true
```

Build passes: `npm run build` — 2882 modules transformed successfully.

## What Was NOT Changed

- `userService.ts` — still stores passwords as plaintext on create/reset (separate issue)
- `AuthContext.tsx` — login flow was already correct, unchanged
- No SQL/migration changes — database records untouched
- No other services modified

## Test Credentials

| Username | Password |
|----------|----------|
| Manish | manish@123 |
| Ashita | ashita123 |
| Apurb | apurb123 |
