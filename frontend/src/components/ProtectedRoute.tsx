import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkPermission } from "../services/roleService";

const ProtectedRoute = ({ children, requiredSystemRole, requiredWorkbookRole, allowedRoles, requiredPermission }: any) => {
  const { token, loading, appUser } = useAuth();
  const location = useLocation();
  const normalizedRoles = appUser?.roles?.map((r) => String(r).trim()) || [];

  if (loading) {
    return <div>Loading...</div>;
  }
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermission) {
    const hasPerm = checkPermission(normalizedRoles, requiredPermission.module, requiredPermission.action);
    if (!hasPerm) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = normalizedRoles.some((role) => allowedRoles.includes(role));
    if (!hasAllowedRole) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  if (requiredSystemRole) {
    const isAdmin =
      normalizedRoles.includes("SuperAdmin") || normalizedRoles.includes("Admin");
    if (!isAdmin) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
    return <>{children}</>;
  }

  if (requiredWorkbookRole) {
    const normalizedWB =
      typeof requiredWorkbookRole === "string" ? requiredWorkbookRole.trim() : "";
    const hasWB = normalizedRoles.includes(normalizedWB);
    if (!hasWB) {
      return <Navigate to="/unauthorized" state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
