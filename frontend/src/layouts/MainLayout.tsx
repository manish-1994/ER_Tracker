import React, { useEffect, useState, useRef } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loadRolesForUser } from "../services/authHelper";
import { checkPermission } from "../services/roleService";
import Header from "../components/Header";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../services/supabaseClient";
import { trackUserPresence, clearUserPresence } from "../services/presenceService";
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
  X,
  LogOut,
  Activity,
  Palette,
} from "lucide-react";

export const MainLayout: React.FC = () => {
  const { logout, appUser, loading } = useAuth();
  const [sidebarRoles, setSidebarRoles] = useState<string[]>([]);
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);
  const [sheetWbMap, setSheetWbMap] = useState<Record<string, number>>({});
  const [presenceStatus, setPresenceStatus] = useState<"online" | "idle">("online");
  const lastActivityRef = useRef<number>(Date.now());
  const lastTrackedRef = useRef<number>(0);

  useEffect(() => {
    if (!appUser?.id) return;
    if (appUser.roles?.length) {
      setSidebarRoles(appUser.roles);
      return;
    }
    loadRolesForUser(appUser.id).then((roles) => setSidebarRoles(roles));
  }, [appUser?.id, appUser?.roles]);

  useEffect(() => {
    if (!appUser?.id) return;
    const updatePresence = async (forceStatus?: "online" | "idle") => {
      const currentStatus = forceStatus || (Date.now() - lastActivityRef.current >= 5 * 60 * 1000 ? "idle" : "online");
      let resolvedWbId: number | null = null;
      const pathParts = location.pathname.split("/");
      if (location.pathname.startsWith("/workbooks/")) {
        const idStr = pathParts[2];
        if (idStr && !isNaN(Number(idStr))) resolvedWbId = Number(idStr);
      } else if (location.pathname.startsWith("/workspace/workbook/")) {
        const idStr = pathParts[3];
        if (idStr && !isNaN(Number(idStr))) resolvedWbId = Number(idStr);
      } else if (location.pathname.startsWith("/worksheets/")) {
        const sheetId = pathParts[2];
        if (sheetId) {
          if (sheetWbMap[sheetId]) {
            resolvedWbId = sheetWbMap[sheetId];
          } else {
            try {
              const { data } = await supabase.from("sheets").select("workbook_id").eq("id", sheetId).single();
              if (data?.workbook_id) {
                const wbId = Number(data.workbook_id);
                setSheetWbMap(prev => ({ ...prev, [sheetId]: wbId }));
                resolvedWbId = wbId;
              }
            } catch {
              // sheets table may not exist - skip workbook resolution silently
            }
          }
        }
      }
const pageName = pathParts[1] ? pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1) : "Dashboard";
       await trackUserPresence(appUser.id, appUser.username, currentStatus, pageName, resolvedWbId ? String(resolvedWbId) : null);
      lastTrackedRef.current = Date.now();
    };
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      if (presenceStatus !== "online") {
        setPresenceStatus("online");
        updatePresence("online");
      } else if (Date.now() - lastTrackedRef.current > 30 * 1000) {
        updatePresence("online");
      }
    };
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);
    updatePresence("online");
    const checkIdleInterval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime >= 5 * 60 * 1000 && presenceStatus === "online") {
        setPresenceStatus("idle");
        updatePresence("idle");
      }
    }, 10000);
    return () => {
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      clearInterval(checkIdleInterval);
    };
  }, [appUser?.id, location.pathname, presenceStatus, sheetWbMap]);

const handleLogout = async () => {
     if (appUser?.id) {
       await clearUserPresence(appUser.id);
     }
    logout();
  };

  const userRolesList = appUser?.roles || sidebarRoles || [];
  const showWorkbooks = checkPermission(userRolesList, "Workbooks", "view");
  const showReports = checkPermission(userRolesList, "Reports", "view");
  const showSettings = checkPermission(userRolesList, "Settings", "view");
  const showDashboardBuilder = checkPermission(userRolesList, "Dashboards", "create");
  const showUsers = checkPermission(userRolesList, "Users", "view");
  const showRoles = checkPermission(userRolesList, "Roles", "view");
  const showAuditLogs = userRolesList.some((r) => r.toLowerCase() === "superadmin");
  const showUserPresence = appUser?.permissions?.includes("view_user_presence") || userRolesList.some((r) => r.toLowerCase() === "superadmin");
  const showThemeStudio = userRolesList.some((r) => r.toLowerCase() === "admin" || r.toLowerCase() === "superadmin");

  const getLinkClass = (path: string, collapsed: boolean) => {
    const isActive = location.pathname.startsWith(path);
    return `relative flex items-center ${collapsed ? "justify-center px-2" : "px-4"} py-3 text-xs font-semibold rounded-md transition-all ${
      isActive 
        ? "text-textPrimary bg-primary border border-primary" 
        : "text-secondary hover:text-textPrimary hover:bg-primary/5 border border-transparent"
    }`;
  };

  const renderNavLinks = (collapsed: boolean) => (
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
        {!collapsed && <span className="truncate">Workspace</span>}
      </Link>
      {!loading && showUserPresence && (
        <Link to="/user-presence" className={getLinkClass("/user-presence", collapsed)} onClick={() => setIsMobileOpen(false)}>
          <Activity className={`w-4.5 h-4.5 shrink-0 ${collapsed ? "" : "mr-3"}`} />
          {!collapsed && <span className="truncate">Presence</span>}
        </Link>
      )}
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
      {!loading && showThemeStudio && (
        <Link to="/theme-studio" className={getLinkClass("/theme-studio", collapsed)} onClick={() => setIsMobileOpen(false)}>
          <Palette className={`w-4.5 h-4.5 shrink-0 ${collapsed ? "" : "mr-3"}`} />
          {!collapsed && <span className="truncate">Themes</span>}
        </Link>
      )}
    </>
  );

  return (
    <div className="flex min-h-screen bg-bgPrimary text-textPrimary overflow-hidden">
      <aside className={`hidden md:flex flex-col glass-panel border-r border-secondary/20 sticky top-0 h-screen py-6 z-20 transition-all duration-300 ${isCollapsed ? "w-[72px]" : "w-[260px]"}`}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center p-1.5 mx-auto mb-4 border border-secondary/20 rounded-md bg-[var(--surface)] text-secondary hover:text-textPrimary transition-all"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className="px-4 mb-8">
          <div className={`flex flex-col items-center justify-center glass-panel-light rounded-xl transition-all ${isCollapsed ? "h-12 w-12 mx-auto p-1" : "p-4"}`}>
            {!isCollapsed && (
              <div className="flex items-center space-x-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span className="text-[10px] font-sans font-semibold text-success">ONLINE</span>
              </div>
            )}
            <div className={`font-sans font-bold text-textPrimary ${isCollapsed ? "text-xs" : "text-xl"}`}>
              {isCollapsed ? "ER" : "ER Tracker"}
            </div>
          </div>
        </div>

        <nav className="flex flex-col flex-1 px-3 space-y-1 overflow-y-auto">
          {renderNavLinks(isCollapsed)}
        </nav>

        <div className="px-3 mt-auto">
          <button 
            onClick={handleLogout} 
            className={`flex items-center justify-center py-2.5 text-xs font-semibold rounded-md border border-danger/20 text-danger bg-danger/5 hover:bg-danger/10 transition-all ${isCollapsed ? "w-10 h-10 mx-auto px-0" : "w-full px-4"}`}
          >
            {isCollapsed ? <LogOut className="w-4.5 h-4.5" /> : "Logout"}
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {isMobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              className="relative w-[260px] flex flex-col glass-panel border-r border-secondary/20 h-full py-6 z-50 shadow-glass-lg"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <button
                onClick={() => setIsMobileOpen(false)}
                className="absolute top-4 right-4 p-1.5 border border-secondary/20 rounded-md bg-[var(--surface)] text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="px-6 mb-8 mt-6">
                <div className="flex flex-col items-center justify-center p-4 glass-panel-light rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-[10px] font-sans font-semibold text-success">ONLINE</span>
                  </div>
                  <div className="text-xl font-sans font-bold text-textPrimary">ER Tracker</div>
                </div>
              </div>
              <nav className="flex flex-col flex-1 px-4 space-y-1 overflow-y-auto">
                {renderNavLinks(false)}
              </nav>
              <div className="px-4 mt-auto">
                <button onClick={() => { setIsMobileOpen(false); handleLogout(); }} className="w-full py-2.5 text-xs font-semibold rounded-md border border-danger/20 text-danger bg-danger/5">
                  Logout
                </button>
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

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