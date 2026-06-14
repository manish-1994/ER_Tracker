# ARCHIVE_LIST

The following files are development utilities, diagnostic scripts, test configs, or legacy SQL migrations. They are not part of the active frontend or database setup, but they should be moved to `docs/archive/` instead of deleted to preserve diagnostic tools and history.

## Root-Level Diagnostic Scripts
These scripts were used for database inspection, mapping verification, and query testing during development. They should be moved from the root folder to `docs/archive/`.

| File Path | Description | Reason for Archiving |
| :--- | :--- | :--- |
| `check_assignments.js` | Diagnostic script for workbook assignments. | Retain as reference for assignment schema. |
| `check_columns.js` | Quick column inspection utility. | Retain for debugging columns. |
| `check_columns_127.js` | Column inspection specific to sheet 127. | Development check. |
| `check_env.js` | Environment variables check. | Development diagnostic. |
| `check_metadata_tables.js` | Database metadata check. | Reference. |
| `check_order_mapping.py` | Column order mapper check. | Python diagnostic. |
| `check_records_table_name.js` | Inspection of records table mapping. | Development diagnostic. |
| `check_sheets_columns.js` | Column count check for sheets. | Development check. |
| `check_sqlite.py` | Local SQLite debug check. | Deprecated SQLite inspector. |
| `check_table_cols.js` | Table column inspector. | Diagnostics. |
| `check_worksheet_rows.js` | Worksheet row fetch diagnostic. | Diagnostics. |
| `clean_metadata.js` | Metadata table cleaner script. | Retention for reference. |
| `convert_mapping.js` | Mapping formatter utility. | Helper tool. |
| `debug_406.js` | Debug file for handling HTTP 406. | Historical troubleshooting. |
| `debug_match.js` | Debug utility for row matches. | Reference. |
| `dump_live_metadata.js` | Dumps current database metadata to JSON. | Reference. |
| `fetch_root.js` | Root endpoint fetch test. | Development script. |
| `fetch_swagger.js` | Swaggers client definitions fetcher. | Reference. |
| `find_exact_mapping.js` | Core mapping resolver. | Development check. |
| `find_sqlite_exact_mapping.py` | SQLite version of exact mapping resolver. | Python diagnostic. |
| `find_sqlite_json.py` | SQLite metadata JSON converter. | Python diagnostic. |
| `find_supabase_exact_mapping.js` | Supabase exact mapper helper. | Reference. |
| `inspect_db_sqlite.py` | Local sqlite inspector script. | Reference. |
| `inspect_sheets_table.js` | JS utility to log sheets structure. | Reference. |
| `inspect_sqlite_records_tables.py` | SQLite records tables checker. | Reference. |
| `inspect_users_table.js` | Checks users table fields. | Reference. |
| `inspect_worksheet_rows.js` | Checks rows within worksheet tables. | Reference. |
| `inspect_workspace_notes_cols.js` | Checks columns of workspace_notes table. | Reference. |
| `match_supabase_sheets.js` | Matches Supabase schemas against expected. | Diagnostic reference. |
| `parse_metadata.py` | XML/JSON metadata parser. | Diagnostic script. |
| `print_process_env.js` | Logs node env variables. | Development script. |
| `print_sheet_18_cols.js` | Sheet 18 specific columns printer. | Reference. |
| `print_sheet_18_cols.py` | Sheet 18 specific columns printer (Python). | Reference. |
| `print_tables_and_columns.js` | Schema metadata formatting script. | Reference. |
| `probe_all_supabase_columns.js` | Systematic database scanner. | Diagnostic reference. |
| `probe_mapping_tables.js` | Scanner for table mapping. | Diagnostic. |
| `probe_rpc_additional.js` | Scans for database RPCs. | Reference. |
| `probe_rpc_endpoints.js` | RPC validation scanner. | Reference. |
| `probe_rpc_single_param.js` | Single parameter RPC scanner. | Reference. |
| `probe_supabase_tables.js` | Comprehensive Supabase schema scanner. | Reference. |
| `probe_system_catalogs.js` | System catalog scanner. | Reference. |
| `query_table.js` | Direct JS database querier. | Quick check tool. |
| `test_columns_in_supabase.js` | Database mapping validator. | Reference. |
| `test_role_join.js` | Tests user roles joins. | Reference. |
| `test_roles_supabase.js` | Validation of role retrieval. | Reference. |
| `test_rpc_sql.js` | Database custom function executor. | Reference. |
| `test_supabase.js` | Supabase connection health check. | Reference. |
| `test_trigger.js` | Triggers database events checks. | Reference. |
| `live_metadata.json` | Dumped metadata JSON. | Database snapshot. |
| `live_metadata_utf8.json` | Dumped UTF-8 metadata JSON. | Database snapshot. |
| `mapping.json` | Mapping configuration export. | Backup mapping. |
| `mapping.txt` | Text export of sheet mapping. | Backup mapping. |
| `mapping_utf8.txt` | Text UTF-8 export of sheet mapping. | Backup mapping. |

## Docs-Level Diagnostic & Test Scripts
These files are located in `docs/` and should be moved into `docs/archive/` to keep the main docs directory clean.

| File Path | Description | Reason for Archiving |
| :--- | :--- | :--- |
| `docs/check_mapping.py` | Sheet mapping verifier. | Reference. |
| `docs/check_schema.js` | Schema verifier. | Reference. |
| `docs/check_schema.py` | Schema verifier (Python). | Reference. |
| `docs/create_test_user.py` | Inserts mock user profile. | Retention for seed reference. |
| `docs/db_check.py` | Connection health check. | Reference. |
| `docs/decode_jwt.py` | JWT token parser. | Diagnostic utility. |
| `docs/diagnostics.py` | Comprehensive status checker. | Troubleshooting utility. |
| `docs/get_hash.py` | Hashed password print helper. | Reference. |
| `docs/legacy_hash_audit.py` | Audits old hashed passwords. | Reference. |
| `docs/login_debug.py` | Logs credentials during login checks. | Diagnostic reference. |
| `docs/login_debug_verbose.py` | Verbose login debugger. | Diagnostic reference. |
| `docs/login_test.js` | JS login simulator. | Test tool. |
| `docs/login_trace.py` | Step-by-step auth tracer. | Diagnostic. |
| `docs/new_hash.py` | Generates sample password hash. | Tool. |
| `docs/run_login_check.py` | Runs login diagnostics sequence. | Test tool. |
| `docs/temp_login.py` | Quick credential test. | Tool. |
| `docs/temp_schema_inspect.py` | Checks local table setups. | Reference. |
| `docs/temp_test_user.py` | Mock user verification script. | Tool. |
| `docs/temp_verify_user.py` | Validates active user accounts. | Reference. |
| `docs/test-verify-insert.js` | Quick row insertion JS check. | Test script. |
| `docs/test_cols.js` | Column inspector JS helper. | Test script. |
| `docs/test_cols.ts` | Column inspector TS helper. | Test script. |
| `docs/test_verify.py` | Connection validator script. | Diagnostic. |
| `docs/update_superadmin.py` | Updates profile to super admin status. | Administration utility. |
| `docs/verify_auth.py` | Authenticator system verifier. | Reference. |
| `docs/verify_password.py` | Password verification algorithm script. | Reference. |
| `docs/verify_routes.py` | Route validation checker. | Reference. |
| `docs/verify_superadmin.py` | Validates super admin privileges. | Administration utility. |
| `docs/favicon-setup-report.md` | Specific report on favicon config. | Troubleshooting note. |

## Docs-Level Legacy SQL Migrations
These are legacy SQL setup scripts stored in `docs/` that are already applied in the DB or replaced by standard Migrations.

| File Path | Description | Reason for Archiving |
| :--- | :--- | :--- |
| `docs/BOOTSTRAP_SUPER_ADMIN.sql` | Seed script for superadmin profile. | Archive as seed reference. |
| `docs/DATABASE_AUTH_MIGRATION.sql` | Migrations for database auth rules. | Reference. |
| `docs/RLS_BYPASS.sql` | Bypass rules for RLS checks. | Reference. |
| `docs/SUPABASE_RLS.sql` | Main Row Level Security configurations. | Database reference. |
| `docs/SUPABASE_SCHEMA.sql` | Baseline database schema definition. | Core schema archive. |
| `docs/SYSTEM_ROLES_MIGRATION.sql` | Seed scripts for role mappings. | Reference. |
| `docs/USER_PROFILES_MIGRATION.sql` | Seed scripts for profiles mapping. | Reference. |
| `docs/WORKSPACE_ASSIGNMENTS_MIGRATION.sql` | Mappings for assignments. | Reference. |
