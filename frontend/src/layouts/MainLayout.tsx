import React from "react";
import { Outlet, Link } from "react-router-dom";

// Simple placeholder main layout with navigation links
const MainLayout: React.FC = () => {
  return (
    <div>
      <nav style={{ padding: "1rem", background: "#f0f0f0" }}>
        <Link to="/dashboard" style={{ marginRight: "1rem" }}>Dashboard</Link>
        <Link to="/workbooks" style={{ marginRight: "1rem" }}>Workbooks</Link>
        <Link to="/profile" style={{ marginRight: "1rem" }}>Profile</Link>
        <Link to="/logout">Logout</Link>
      </nav>
      <main style={{ padding: "1rem" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
