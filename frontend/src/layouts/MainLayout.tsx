import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loadRolesForUser } from "../services/authHelper";
import { checkPermission } from "../services/roleService";
import Header from "../components/Header";
import { motion } from "framer-motion";

export const MainLayout: React.FC = () => {
  const { logout, appUser, loading } = useAuth();
  const [sidebarRoles, setSidebarRoles] = useState<string[]>([]);
  const location = useLocation();

  // Hydrate roles for sidebar when context roles are missing or stale
  useEffect(() => {
    if (!appUser?.id) {
      setSidebarRoles([]);
      return;
    }

    if (appUser.roles?.length) {
      setSidebarRoles(appUser.roles);
      return;
    }

    let cancelled = false;
    loadRolesForUser(appUser.id).then((roles) => {
      if (!cancelled) setSidebarRoles(roles);
    });
    return () => {
      cancelled = true;
    };
  }, [appUser?.id, appUser?.roles]);

  const userRolesList = appUser?.roles || sidebarRoles || [];

  const showWorkbooks = checkPermission(userRolesList, "Workbooks", "view");
  const showReports = checkPermission(userRolesList, "Reports", "view");
  const showSettings = checkPermission(userRolesList, "Settings", "view");
  const showDashboardBuilder = checkPermission(userRolesList, "Dashboards", "create");
  const showUsers = checkPermission(userRolesList, "Users", "view");
  const showRoles = checkPermission(userRolesList, "Roles", "view");
  const showAuditLogs = userRolesList.some((r) => r.toLowerCase() === "superadmin");

  const isOnline = true;

  const getLinkClass = (path: string) => {
    const isActive = location.pathname.startsWith(path);
    return `relative flex items-center px-4 py-3 font-mono text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${
      isActive 
        ? "text-primary border border-primary/30 bg-primary/5 shadow-[0_0_12px_rgba(0,229,255,0.1)]" 
        : "text-muted hover:text-primary hover:bg-primary/5 border border-transparent"
    }`;
  };

  return (
    <div className="flex min-h-screen bg-cyberBg text-text overflow-hidden">
      {/* Sidebar navigation */}
      <aside className="w-[260px] flex flex-col bg-[#050b14]/90 backdrop-blur-lg border-r border-cyan-500/20 sticky top-0 h-screen py-6 z-20">
        {/* Brand Header */}
        <div className="px-6 mb-8">
          <div className="flex flex-col items-center justify-center p-4 border border-cyan-500/10 bg-[#0a0f1d]/40 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/55" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/55" />
            
            <div className="flex items-center space-x-2 mb-2">
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-success animate-pulse shadow-[0_0_8px_#00FF9D]" : "bg-danger"}`} />
              <span className="text-[10px] font-mono tracking-widest text-success uppercase font-bold">
                {isOnline ? "OPERATIONAL" : "OFFLINE"}
              </span>
            </div>
            <div className="text-xl font-mono font-black tracking-widest text-primary neon-text-primary">
              ER_TRACKER
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex flex-col flex-1 px-4 space-y-1.5 overflow-y-auto">
          <Link to="/dashboard" className={getLinkClass("/dashboard")}>
            <span className="mr-3">■</span> Dashboard
          </Link>
          
{!loading && showWorkbooks && (
            <Link to="/workbooks" className={getLinkClass("/workbooks")}>
              <span className="mr-3">■</span> Workbooks
            </Link>
          )}

          <Link to="/workspace" className={getLinkClass("/workspace")}>
            <span className="mr-3">💼</span> User Workspace
          </Link>

          {!loading && showReports && (
            <Link to="/reports" className={getLinkClass("/reports")}>
              <span className="mr-3">■</span> Reports
            </Link>
          )}

          {!loading && showDashboardBuilder && (
            <Link to="/dashboard-builder" className={getLinkClass("/dashboard-builder")}>
              <span className="mr-3">■</span> Builder
            </Link>
          )}

          {!loading && showUsers && (
            <Link to="/users" className={getLinkClass("/users")}>
              <span className="mr-3">■</span> Users
            </Link>
          )}

          {!loading && showRoles && (
            <Link to="/roles" className={getLinkClass("/roles")}>
              <span className="mr-3">■</span> Roles
            </Link>
          )}

          {!loading && showAuditLogs && (
            <Link to="/audit-history" className={getLinkClass("/audit-history")}>
              <span className="mr-3">■</span> Audit Logs
            </Link>
          )}

          {!loading && showSettings && (
            <Link to="/settings" className={getLinkClass("/settings")}>
              <span className="mr-3">■</span> Settings
            </Link>
          )}

          <Link to="/profile" className={getLinkClass("/profile")}>
            <span className="mr-3">■</span> Profile
          </Link>

          {userRolesList.some((r) => r.toLowerCase() === "superadmin") && (
            <Link to="/storage-management" className={getLinkClass("/storage-management")}>
              <span className="mr-3">■</span> Storage Management
            </Link>
          )}
        </nav>

        {/* Footer actions */}
        <div className="px-4 mt-auto">
          <button 
            onClick={logout} 
            className="w-full flex items-center justify-center px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-widest rounded-lg border border-danger/25 text-danger bg-danger/5 hover:bg-danger/10 hover:shadow-[0_0_12px_rgba(255,77,109,0.2)] transition-all duration-300"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10">
        <Header />
        <main className="p-8 flex-1 w-full max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
