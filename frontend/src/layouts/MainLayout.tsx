import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loadRolesForUser } from "../services/authHelper";
import { checkPermission } from "../services/roleService";
import Header from "../components/Header";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  BarChart3,
  Sliders,
  Users,
  ShieldCheck,
  History,
  Settings as SettingsIcon,
  User,
  HardDrive,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

export const MainLayout: React.FC = () => {
  const { logout, appUser, loading } = useAuth();
  const [sidebarRoles, setSidebarRoles] = useState<string[]>([]);
  const location = useLocation();

  // Collapsible sidebar state (Desktop / Tablet)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  // Mobile drawer state
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Auto-collapse on smaller screens (Tablet width)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsCollapsed(false);
      } else {
        setIsCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const getLinkClass = (path: string, collapsed: boolean) => {
    const isActive = location.pathname.startsWith(path);
    return `relative flex items-center ${collapsed ? "justify-center px-2" : "px-4"} py-3 font-mono text-xs font-bold uppercase tracking-widest rounded-lg transition-all duration-300 ${
      isActive 
        ? "text-primary border border-primary/30 bg-primary/5 shadow-[0_0_12px_rgba(0,229,255,0.1)]" 
        : "text-muted hover:text-primary hover:bg-primary/5 border border-transparent"
    }`;
  };

  const renderNavLinks = (collapsed: boolean) => {
    return (
      <>
        <Link to="/dashboard" className={getLinkClass("/dashboard", collapsed)} onClick={() => setIsMobileOpen(false)}>
          <LayoutDashboard className={`w-4.5 h-4.5 shrink-0 ${collapsed ? "" : "mr-3"}`} />
          {!collapsed && <span className="truncate">Dashboard</span>}
        </Link>
        
        {!loading && showWorkbooks && (
          <Link to="/workbooks" className={getLinkClass("/workbooks", collapsed)} onClick={() => setIsMobileOpen(false)}>
            <BookOpen className={`w-4.5 h-4.5 shrink-0 ${collapsed ? "" : "mr-3"}`} />
            {!collapsed && <span className="truncate">Workbooks</span>}
          </Link>
        )}

        <Link to="/workspace" className={getLinkClass("/workspace", collapsed)} onClick={() => setIsMobileOpen(false)}>
          <Briefcase className={`w-4.5 h-4.5 shrink-0 ${collapsed ? "" : "mr-3"}`} />
          {!collapsed && <span className="truncate">User Workspace</span>}
        </Link>

        {!loading && showReports && (
          <Link to="/reports" className={getLinkClass("/reports", collapsed)} onClick={() => setIsMobileOpen(false)}>
            <BarChart3 className={`w-4.5 h-4.5 shrink-0 ${collapsed ? "" : "mr-3"}`} />
            {!collapsed && <span className="truncate">Reports</span>}
          </Link>
        )}

        {!loading && showDashboardBuilder && (
          <Link to="/dashboard-builder" className={getLinkClass("/dashboard-builder", collapsed)} onClick={() => setIsMobileOpen(false)}>
            <Sliders className={`w-4.5 h-4.5 shrink-0 ${collapsed ? "" : "mr-3"}`} />
            {!collapsed && <span className="truncate">Builder</span>}
          </Link>
        )}

        {!loading && showUsers && (
          <Link to="/users" className={getLinkClass("/users", collapsed)} onClick={() => setIsMobileOpen(false)}>
            <Users className={`w-4.5 h-4.5 shrink-0 ${collapsed ? "" : "mr-3"}`} />
            {!collapsed && <span className="truncate">Users</span>}
          </Link>
        )}

        {!loading && showRoles && (
          <Link to="/roles" className={getLinkClass("/roles", collapsed)} onClick={() => setIsMobileOpen(false)}>
            <ShieldCheck className={`w-4.5 h-4.5 shrink-0 ${collapsed ? "" : "mr-3"}`} />
            {!collapsed && <span className="truncate">Roles</span>}
          </Link>
        )}

        {!loading && showAuditLogs && (
          <Link to="/audit-history" className={getLinkClass("/audit-history", collapsed)} onClick={() => setIsMobileOpen(false)}>
            <History className={`w-4.5 h-4.5 shrink-0 ${collapsed ? "" : "mr-3"}`} />
            {!collapsed && <span className="truncate">Audit Logs</span>}
          </Link>
        )}

        {!loading && showSettings && (
          <Link to="/settings" className={getLinkClass("/settings", collapsed)} onClick={() => setIsMobileOpen(false)}>
            <SettingsIcon className={`w-4.5 h-4.5 shrink-0 ${collapsed ? "" : "mr-3"}`} />
            {!collapsed && <span className="truncate">Settings</span>}
          </Link>
        )}

        <Link to="/profile" className={getLinkClass("/profile", collapsed)} onClick={() => setIsMobileOpen(false)}>
          <User className={`w-4.5 h-4.5 shrink-0 ${collapsed ? "" : "mr-3"}`} />
          {!collapsed && <span className="truncate">Profile</span>}
        </Link>

        {userRolesList.some((r) => r.toLowerCase() === "superadmin") && (
          <Link to="/storage-management" className={getLinkClass("/storage-management", collapsed)} onClick={() => setIsMobileOpen(false)}>
            <HardDrive className={`w-4.5 h-4.5 shrink-0 ${collapsed ? "" : "mr-3"}`} />
            {!collapsed && <span className="truncate">Storage</span>}
          </Link>
        )}
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-cyberBg text-text overflow-hidden">
      {/* ── Desktop/Tablet Permanent Navigation ── */}
      <aside className={`hidden md:flex flex-col bg-[#050b14]/90 backdrop-blur-lg border-r border-cyan-500/20 sticky top-0 h-screen py-6 z-20 transition-all duration-300 ${isCollapsed ? "w-[72px]" : "w-[260px]"}`}>
        {/* Collapse Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center p-1.5 mx-auto mb-4 border border-cyan-500/20 rounded bg-[#0a0f1d]/60 text-primary hover:text-white transition-all"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Brand Header */}
        <div className="px-4 mb-8">
          <div className={`flex flex-col items-center justify-center border border-cyan-500/10 bg-[#0a0f1d]/40 rounded-xl relative overflow-hidden transition-all duration-300 ${isCollapsed ? "h-12 w-12 mx-auto p-1" : "p-4"}`}>
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/55" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/55" />
            
            {!isCollapsed && (
              <div className="flex items-center space-x-2 mb-2">
                <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-success animate-pulse shadow-[0_0_8px_#00FF9D]" : "bg-danger"}`} />
                <span className="text-[10px] font-mono tracking-widest text-success uppercase font-bold">
                  {isOnline ? "OPERATIONAL" : "OFFLINE"}
                </span>
              </div>
            )}
            <div className={`font-mono font-black text-primary neon-text-primary ${isCollapsed ? "text-xs tracking-normal" : "text-xl tracking-widest"}`}>
              {isCollapsed ? "ER" : "ER_TRACKER"}
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <nav className="flex flex-col flex-1 px-3 space-y-1.5 overflow-y-auto">
          {renderNavLinks(isCollapsed)}
        </nav>

        {/* Footer actions */}
        <div className="px-3 mt-auto">
          <button 
            onClick={logout} 
            className={`flex items-center justify-center py-2.5 font-mono text-xs font-bold uppercase tracking-widest rounded-lg border border-danger/25 text-danger bg-danger/5 hover:bg-danger/10 hover:shadow-[0_0_12px_rgba(255,77,109,0.2)] transition-all duration-300 ${isCollapsed ? "w-10 h-10 mx-auto px-0" : "w-full px-4"}`}
            title="Logout"
          >
            {isCollapsed ? <LogOut className="w-4.5 h-4.5" /> : "Logout"}
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar Slide-Out Drawer Navigation ── */}
      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            {/* Backdrop Overlay */}
            <motion.div
              className="fixed inset-0 bg-[#020617]/85 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
            />
            
            {/* Drawer Panel */}
            <motion.aside
              className="relative w-[260px] flex flex-col bg-[#050b14] border-r border-cyan-500/20 h-full py-6 z-50 shadow-[5px_0_25px_rgba(0,0,0,0.5)]"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 border border-cyan-500/20 rounded bg-[#0a0f1d]/60 text-primary hover:text-white"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Brand Header */}
              <div className="px-6 mb-8 mt-6">
                <div className="flex flex-col items-center justify-center p-4 border border-cyan-500/10 bg-[#0a0f1d]/40 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary/55" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary/55" />
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_#00FF9D]" />
                    <span className="text-[10px] font-mono tracking-widest text-success uppercase font-bold">OPERATIONAL</span>
                  </div>
                  <div className="text-xl font-mono font-black tracking-widest text-primary neon-text-primary">
                    ER_TRACKER
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col flex-1 px-4 space-y-1.5 overflow-y-auto">
                {renderNavLinks(false)}
              </nav>

              {/* Logout Footer Button */}
              <div className="px-4 mt-auto">
                <button 
                  onClick={() => { setIsMobileOpen(false); logout(); }} 
                  className="w-full flex items-center justify-center px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-widest rounded-lg border border-danger/25 text-danger bg-danger/5 hover:bg-danger/10 hover:shadow-[0_0_12px_rgba(255,77,109,0.2)] transition-all duration-300"
                >
                  Logout
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* ── Main Content Viewport ── */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto relative z-10">
        <Header onMenuToggle={() => setIsMobileOpen(!isMobileOpen)} />
        <main className="p-4 sm:p-6 md:p-8 flex-1 w-full max-w-7xl mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
