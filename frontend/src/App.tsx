import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Workbooks from "./pages/Workbooks";
import Profile from "./pages/Profile";
import Logout from "./pages/Logout";
import UserManagement from "./pages/UserManagement";
import MainLayout from "./layouts/MainLayout";
import { AuthProvider } from "./context/AuthContext";
import RootRedirect from "./components/RootRedirect";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Root redirect – decides based on auth state */}
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Index route inside protected area – redirect to dashboard */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="workbooks" element={<Workbooks />} />
          <Route path="profile" element={<Profile />} />
          <Route
            path="users"
            element={
              <ProtectedRoute requiredRole="SuperAdmin">
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route path="logout" element={<Logout />} />
        </Route>
        </Routes>
    </AuthProvider>
  );
};

export default App;