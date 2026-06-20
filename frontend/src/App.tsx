import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Unauthorized from "./pages/Unauthorized";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Workbooks from "./pages/Workbooks";
import Worksheet from "./pages/Worksheet";
import WorkbookDetail from "./pages/WorkbookDetail";
import Profile from "./pages/Profile";
import Logout from "./pages/Logout";
import UserManagement from "./pages/UserManagement";
import RoleManagement from "./pages/RoleManagement";
import DashboardBuilder from "./pages/DashboardBuilder";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AuditHistory from "./pages/AuditHistory";
import StorageManagement from "./pages/StorageManagement";
import UserWorkspace from "./pages/UserWorkspace";
import WorkspaceWorkbook from "./pages/WorkspaceWorkbook";
import UserPresence from "./pages/UserPresence";
import MainLayout from "./layouts/MainLayout";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import ThemeStudio from "./pages/ThemeStudio";
import { SettingsProvider } from "./context/SettingsContext";
import RootRedirect from "./components/RootRedirect";

const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <ThemeProvider>
          <SettingsProvider>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/" element={<RootRedirect />} />
            {/* Protected area */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
<Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route
                path="workbooks"
                element={
                  <ProtectedRoute requiredPermission={{ module: "Workbooks", action: "view" }}>
                    <Workbooks />
                  </ProtectedRoute>
                }
              />
              <Route path="workspace" element={<UserWorkspace />} />
              <Route path="workspace/workbook/:id" element={<WorkspaceWorkbook />} />
              <Route
                path="reports"
                element={
                  <ProtectedRoute requiredPermission={{ module: "Reports", action: "view" }}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="dashboard-builder"
                element={
                  <ProtectedRoute requiredPermission={{ module: "Dashboards", action: "create" }}>
                    <DashboardBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users"
                element={
                  <ProtectedRoute requiredPermission={{ module: "Users", action: "view" }}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="roles"
                element={
                  <ProtectedRoute requiredPermission={{ module: "Roles", action: "view" }}>
                    <RoleManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="workbooks/:workbookId/sheets/:sheetId/records/:recordId"
                element={
                  <ProtectedRoute requiredPermission={{ module: "Worksheets", action: "view" }}>
                    <Worksheet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="workbooks/:id"
                element={
                  <ProtectedRoute requiredPermission={{ module: "Workbooks", action: "view" }}>
                    <WorkbookDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="worksheets/:id"
                element={
                  <ProtectedRoute requiredPermission={{ module: "Worksheets", action: "view" }}>
                    <Worksheet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute requiredPermission={{ module: "Settings", action: "view" }}>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route path="profile" element={<Profile />} />
               <Route
                 path="theme-studio"
                 element={
                   <ProtectedRoute allowedRoles={["Admin", "SuperAdmin"]}>
                     <ThemeStudio />
                   </ProtectedRoute>
                 }
               />
              <Route
                path="audit-history"
                element={
                  <ProtectedRoute allowedRoles={["SuperAdmin"]}>
                    <AuditHistory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="storage-management"
                element={
                  <ProtectedRoute allowedRoles={["SuperAdmin"]}>
                    <StorageManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="user-presence"
                element={
                  <ProtectedRoute>
                    <UserPresenceRouteGuard />
                  </ProtectedRoute>
                }
              />
<Route path="logout" element={<Logout />} />
            </Route>
          </Routes>
          </SettingsProvider>
        </ThemeProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

const UserPresenceRouteGuard: React.FC = () => {
  const { appUser } = useAuth();
  const hasAccess = appUser?.permissions?.includes("view_user_presence") || 
                    appUser?.roles?.some(r => r.toLowerCase() === "superadmin");
  return hasAccess ? <UserPresence /> : <Navigate to="/unauthorized" replace />;
};

export default App;
