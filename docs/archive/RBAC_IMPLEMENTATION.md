# Role-Based Access Control (RBAC)

This document details the RBAC security models, permissions matrices, and route guards implemented in the system.

## Role Configurations

### 1. `SuperAdmin`
- Full clearance level.
- Unrestricted access to all modules: Dashboards, Workbooks, Worksheets, Reports, Users, Roles, Settings.
- Has exclusive authorization to perform Storage Cleanup overrides and view full Audit trail logs.

### 2. `Admin`
- Full administrative access except Role Management and dangerous full database purges.

### 3. `Manager`
- Medium clearance level.
- Permitted to view dashboards, reports, and upload/manage workbooks.
- Denied access to Users, Roles, and Settings modules.

### 4. `Analyst`
- Renders assigned worksheets and view dashboards.
- Denied access to edit columns, manage user accounts, or execute overrides.

### 5. `Viewer`
- Read-only clearance level.
- Denied all editing, creation, or deletion capabilities across all modules.

## Permission Matrix
- Supports dynamic 7x4 matrix check:
  - Modules: Dashboards, Workbooks, Worksheets, Reports, Users, Roles, Settings.
  - Actions: View, Create, Edit, Delete.
- Sidebar links and routes check user permissions using a unified `checkPermission` helper, immediately hiding options and blocking routes for unauthorized roles.
