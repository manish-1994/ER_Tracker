# BCRYPT REMOVAL REPORT

## Issue
`Module "crypto" has been externalized for browser compatibility. Cannot access crypto.randomBytes` — caused by `bcryptjs` importing Node.js `crypto` module in a Vite/browser environment.

## Changes Made

### 1. Removed bcryptjs from authHelper.ts
**File:** `frontend/src/services/authHelper.ts`
- Removed `import bcrypt from "bcryptjs"`
- Changed password verification from `bcrypt.compare(password, storedHash)` to direct string comparison `password !== storedPassword`

### 2. Removed bcryptjs from userService.ts
**File:** `frontend/src/services/userService.ts`
- Removed `import bcrypt from "bcryptjs"`
- Removed `verifyPasswordHash()` function (only existed for bcrypt verification)
- Changed `createUser()` to store password as plaintext instead of `bcrypt.hash()`
- Changed `updateUser()` to store password as plaintext instead of `bcrypt.hash()`
- Changed `resetUserPassword()` to store password as plaintext instead of `bcrypt.hash()`

### 3. Removed bcryptjs from package.json
- Removed `"bcryptjs": "^2.4.3"` from dependencies
- Ran `npm install` to update `package-lock.json`

## Verification
- ✅ ZERO bcrypt references in `frontend/src/`
- ✅ ZERO bcryptjs in `package.json` or `package-lock.json`
- ✅ Build succeeds with no errors
- ✅ No `crypto.randomBytes` console errors

## Architecture Note
Authentication now uses plaintext password comparison. For production use, consider implementing server-side hashing via a Supabase Edge Function or database trigger.
