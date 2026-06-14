# Audit Logging Report

This document reports on the persistent system operations audit trails.

## Logged Actions
The logging service tracks:
- User logins & logouts.
- Workbook uploads & deletions.
- Worksheet column name changes and visibility updates.
- Worksheet row insertions, edits, deletions, and bulk deletes.
- User account creations, deletions, edits, and activations/deactivations.
- System role creations, deletions, edits, and permissions assignments.
- Storage cleanup actions and dev database overrides.

## Hybrid Persistency Store
- All logs are cached instantly to the browser's `localStorage` under the `local_audit_logs` key.
- Simultaneously, the service attempts to write the log row to the remote Supabase `audit_logs` database table.
- If the database table does not exist or write failures occur, the service fails silently, relying on the localStorage persistent store as a backup mirror.
- **Audit Logs View**: SuperAdmins can view the full combined audit trail history sorted by timestamp on the Audit Logs page.
