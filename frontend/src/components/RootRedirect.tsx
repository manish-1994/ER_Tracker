import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Determines the correct landing page for the root URL ("/").
 * If the user is authenticated (a token exists), they are sent to the
 * dashboard. Otherwise they are sent to the login page.
 */
const RootRedirect: React.FC = () => {
  const { token } = useAuth();
  return token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
};

export default RootRedirect;
