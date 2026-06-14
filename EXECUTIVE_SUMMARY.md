# ER Tracker Dashboard - Executive Summary

## Overview

A React-based workbook management system with user/workspace permissions, built on Supabase. Handles XLSX/CSV uploads, dynamic worksheet rendering, and row-level data operations.

## Architecture

**Frontend**: React 18.3 + TypeScript + Vite
**Backend**: Supabase (PostgreSQL)
**Auth**: Custom bcrypt (not Supabase Auth)
**UI**: Tailwind CSS + custom Cyber* components

## Features (Production Status)

| Module | Status | Notes |
|--------|--------|-------|
| Authentication | ✅ WORKING | Custom bcrypt-based login |
| Workbook Upload | ✅ WORKING | XLSX/CSV parsing, progress modal |
| Worksheet View | ✅ WORKING | Column rendering, row CRUD |
| Export | ✅ WORKING | XLSX/CSV/PDF export |
| Workspace Assignment | ⚠️ PARTIAL | Workbook-only (sheet-level not implemented) |
| Notes | ⚠️ PARTIAL | RLS disabled - security risk |
| Audit Logging | ⚠️ PARTIAL | RLS disabled - security risk |
| User Management | ✅ WORKING | Role assignment, password reset |
| Role Management | ✅ WORKING | CRUD with default matrix |
| Reports | ❌ NOT IMPLEMENTED | Page exists but no functionality |

## Security Concerns

1. **workspace_notes**: Row Level Security DISABLED (line 24 in migration)
2. **audit_logs**: Row Level Security DISABLED (line 42 in migration)
3. Passwords stored in custom table without Supabase Auth protection

## Database Schema

- 7 core tables: users, roles, user_roles, permissions, role_permissions, workbooks, sheets, columns
- Dynamic tables: 23 `records_<uuid>` tables for row data
- Mapping: sheets.records_table_name links to dynamic tables

## Documentation

Full documentation in `docs/`:
- 01_SYSTEM_OVERVIEW.md - Tech stack and architecture
- 02_FEATURE_INVENTORY.md - All modules mapped to code
- 03_USER_GUIDE.md - User workflows
- 04_ADMIN_GUIDE.md - Admin operations
- 05_WORKSPACE_GUIDE.md - Workspace and assignment flows
- 06_DATABASE_DOCUMENTATION.md - Schema with ER diagram
- 07_PERMISSION_MATRIX.md - Role permissions
- 08_WORKFLOWS.md - Sequence diagrams
- 09_DEVELOPER_GUIDE.md - Setup and patterns
- 10_GAP_ANALYSIS.md - Risks and missing features

## Quick Start

```bash
cd frontend
npm install
npm run dev
```

## Key Decisions

- Dynamic tables use sanitized header names as column names
- Soft delete on rows with 8-second undo window
- Progress modal for upload tracking
- localStorage fallback when tables missing