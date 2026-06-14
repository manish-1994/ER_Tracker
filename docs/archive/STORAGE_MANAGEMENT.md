# Storage Management Page

This document details the diagnostic storage options, database purges, and security verification protocols.

## UI Features
- Only visible to users possessing the `SuperAdmin` role.
- High-contrast visual cards clearly separating specific storage purges from dangerous system overrides.

## Delete Operations

### 1. Specific Purges
- **Wipe Single Workbook**: Purges selected workbook, sheets, and columns from the database, and clears corresponding local storage caching.
- **Wipe Single Worksheet**: Purges specific sheet and metadata columns.
- **Wipe Dashboard Configs**: Clears all assigned user dashboard widgets from localStorage.
- **Prune Caches & Temp**: Wipes local row caches and column resolution mapping tables from browser storage.

### 2. Dangerous System Overrides
- **Wipe System Logs**: Deletes all entries from the local audit trail cache and the `audit_logs` database table.
- **Wipe System Workbooks**: Truncates all workbooks, sheets, columns, and row tables in the database.
- **Reset Development Database**: Completely sweeps columns, sheets, workbooks, user profiles, dashboards, and config parameters. The current SuperAdmin profile is spared.

## Challenge Verification Gate
- To prevent accidental data wipes, destructive actions trigger a modal requiring:
  1. Acknowledging permanence check.
  2. Confirming clearance level check.
  3. Typing the exact challenge code phrase: `SYSTEM OVERRIDE RESYNC`.
- Execution is completely blocked until all three conditions are fully satisfied.
