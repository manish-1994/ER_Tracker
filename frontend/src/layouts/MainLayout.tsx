import React, { useEffect, useState } from "react";
import { API_BASE, HEALTH_URL } from "../config/api";
import { Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";

// Simple placeholder main layout with navigation links
const MainLayout: React.FC = () => {
  const { token, logout } = useAuth();
  // Determine role for conditional User Management link
  let isSuperAdmin = false;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const roles: string[] = payload.roles || [];
      isSuperAdmin = roles.includes("SuperAdmin");
    } catch (e) {
      console.error("Failed to decode JWT payload", e);
    }
  }

  // ---------- Global online/offline indicator ----------
  const [isOnline, setIsOnline] = useState<boolean>(true);

  // Fetch health endpoint every 15 seconds
  useEffect(() => {
  const fetchHealth = async () => {
    try {
      // Use the centralized HEALTH_URL which already points to the correct /health endpoint
      const url = HEALTH_URL;
      console.log("Health Check URL:", url);
      const resp = await fetch(url);
      console.log("Health Check Status:", resp.status);
      setIsOnline(resp.ok);
    } catch {
      setIsOnline(false);
    }
  };
    // initial fetch
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex min-h-screen bg-[#050816]">
      {/* Sidebar A */}
      <aside className="w-[260px] hidden md:flex flex-col bg-[#0B1220] backdrop-blur-md border-r border-cyan-500/30 sticky top-0 h-screen py-6">
        {/* Logo / Title */}
        <div className="px-4 mb-8 text-center text-2xl font-bold text-[#22D3EE]">
          {isOnline ? <span>🟢 ONLINE </span> : <span>🔴 OFFLINE </span>}ER Tracker
        </div>
        <nav className="flex flex-col flex-1 px-4 space-y-2">
          <Link to="/dashboard" className="nav-item">Dashboard</Link>
          <Link to="/workbooks" className="nav-item">Workbooks</Link>
          <Link to="/profile" className="nav-item">Profile</Link>
          {isSuperAdmin && (
            <>
              <Link to="/user-management" className="nav-item">User Management</Link>
              <Link to="/admin" className="nav-item">Admin Control Center</Link>
            </>
          )}
        </nav>
        {/* Logout at bottom */}
        <button onClick={logout} className="nav-item mt-auto mb-4 mx-4">Logout</button>
      </aside>
      <div className="flex-1 flex flex-col overflow-auto">
        {/* Header */}
        <Header />
        <main className="p-6 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// export default MainLayout; (removed duplicate)
export default MainLayout;
