# Role-Based Access Control (RBAC) Implementation Plan

This document details the security clearances, permissions tables, page-level routing protections, and sidebar visibility rules for the Workbook Platform.

---

## 1. Permission Matrix Configuration

The RBAC system leverages a modular permission matrix. Access controls are mapped across 7 system modules and 4 core operations:

### Security Modules
1.  **Dashboards**
2.  **Workbooks**
3.  **Worksheets**
4.  **Reports**
5.  **Users**
6.  **Roles**
7.  **Settings**

### Clearances Actions
*   **View**
*   **Create**
*   **Edit**
*   **Delete**

---

## 2. Interactive Permissions Control deck

The **Roles** management interface (`RoleManagement.tsx`) allows SuperAdmins to configure these check matrices dynamically and serialize them to a hybrid local storage backend under the `"role_permission_matrices"` index:

*   **Role Cloning**: Replicates a source clearance level's metadata and permission matrix to a new template instantly, saving administrator setup time.
*   **Default Matrices**: Sensible default presets (e.g. Viewer has view-only Dashboard permissions; Analysts have Workbook reading permissions; Managers can import workbooks; Admins have full module access).

---

## 3. Dynamic Guards & Sidebar Mappings

Client-side routes and sidebar buttons query permissions dynamically via `checkPermission(userRoles, module, action)` inside `App.tsx` and `MainLayout.tsx`:

```typescript
// Example Route Guard
<Route
  path="workbooks"
  element={
    <ProtectedRoute requiredPermission={{ module: "Workbooks", action: "view" }}>
      <Workbooks />
    </ProtectedRoute>
  }
/>
```

```typescript
// Sidebar Navigation Mappings
const showWorkbooks = checkPermission(userRolesList, "Workbooks", "view");
const showReports = checkPermission(userRolesList, "Reports", "view");
const showSettings = checkPermission(userRolesList, "Settings", "view");
const showDashboardBuilder = checkPermission(userRolesList, "Dashboards", "create");
const showUsers = checkPermission(userRolesList, "Users", "view");
const showRoles = checkPermission(userRolesList, "Roles", "view");
```
This guarantees sidebar buttons and pages automatically hide and restrict entry if the logged-in user lacks the permission in their matrix.
