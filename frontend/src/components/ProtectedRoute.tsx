import React from "react";
import { Navigate, useLocation } from "react-router-dom";

/** Wrapper that checks for a JWT and optionally a required role */
const ProtectedRoute = ({ children, requiredRole }: any) => {
  const location = useLocation();
  const token = localStorage.getItem("jwt");
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (requiredRole) {
    // Decode JWT payload (base64) without verification – sufficient for UI gating
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const roles: string[] = payload.roles || [];
      if (!roles.includes(requiredRole)) {
        return <Navigate to="/" replace />;
      }
    } catch (e) {
      return <Navigate to="/login" replace />;
    }
  }
  return <>{children}</>;
};

export default ProtectedRoute;
