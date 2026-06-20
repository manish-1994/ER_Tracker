import React, { useEffect, useState } from "react";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberStatCard } from "../components/ui/CyberStatCard";
import { CyberBadge } from "../components/ui/CyberBadge";
import { getPresences, subscribeToPresence, UserPresence as PresenceData } from "../services/presenceService";
import { getWorkbooks } from "../services/workbookService";
import { getUsers } from "../services/userService";
import { 
  Users, 
  Activity, 
  UserMinus, 
  BookOpen, 
  Monitor, 
  Compass, 
  Clock, 
  Eye 
} from "lucide-react";

const UserPresence: React.FC = () => {
  const [presences, setPresences] = useState<PresenceData[]>([]);
  const [workbooks, setWorkbooks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Ticking state to force re-render for session durations
  const [, setTick] = useState(0);

  const fetchData = async () => {
    try {
      const [presenceList, wbList, userList] = await Promise.all([
        getPresences(),
        getWorkbooks(),
        getUsers()
      ]);
      setPresences(presenceList);
      setWorkbooks(wbList);
      setUsers(userList);
    } catch (err) {
      console.error("Presence telemetry fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime updates
    const unsubscribe = subscribeToPresence(() => {
      fetchData();
    });

    // Session duration ticking timer (updates every second)
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  // Map workbook ID to Workbook Name
  const getWorkbookName = (wbId: number | string | null): string => {
    if (!wbId) return "None / Navigation";
    const found = workbooks.find(w => String(w.id) === String(wbId));
    return found ? found.name : `Workbook #${wbId}`;
  };

  // Map user ID to User Roles
  const getUserRoleString = (userId: string): string => {
    const found = users.find(u => String(u.id) === String(userId));
    if (!found || !found.roles || found.roles.length === 0) return "Viewer";
    return found.roles.map((r: any) => typeof r === "object" ? r.name : r).join(", ");
  };

  // Calculate user status dynamically (online, idle, offline)
  const getComputedStatus = (p: PresenceData): "online" | "idle" | "offline" => {
    const lastSeenTime = new Date(p.last_seen).getTime();
    const diffMs = Date.now() - lastSeenTime;
    
    if (p.status === "offline" || diffMs > 10 * 60 * 1000) {
      return "offline";
    }
    if (p.status === "idle" || diffMs >= 5 * 60 * 1000) {
      return "idle";
    }
    return "online";
  };

  // Process data lists
  const activePresences = presences.map(p => ({
    ...p,
    computedStatus: getComputedStatus(p)
  })).filter(p => p.computedStatus !== "offline");

  const onlineUsers = activePresences.filter(p => p.computedStatus === "online");
  const idleUsers = activePresences.filter(p => p.computedStatus === "idle");
  
  // Offline users: registered users not present in active list
  const activeUserIds = new Set(activePresences.map(p => Number(p.user_id)));
  const offlineUsers = users.filter(u => !activeUserIds.has(Number(u.id)));

  // Count active workbooks (unique workbook IDs currently being viewed)
  const activeWorkbookIds = new Set(
    activePresences
      .map(p => p.current_workbook_id)
      .filter(id => id !== null && id !== undefined)
  );

  const formatDuration = (sessionStart: string) => {
    const start = new Date(sessionStart).getTime();
    const diffMs = Date.now() - start;
    if (diffMs < 0) return "0s";
    
    const diffSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(diffSecs / 60);
    const hrs = Math.floor(mins / 60);
    
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${diffSecs % 60}s`;
    return `${diffSecs}s`;
  };

  const getStatusBadge = (status: "online" | "idle" | "offline") => {
    if (status === "online") {
      return (
        <span className="flex items-center gap-1.5 text-xs text-success font-bold font-sans">
          <span className="w-2 h-2 rounded-full bg-success" />
          ONLINE
        </span>
      );
    }
    if (status === "idle") {
      return (
        <span className="flex items-center gap-1.5 text-xs text-warning font-bold font-sans">
          <span className="w-2 h-2 rounded-full bg-warning" />
          IDLE
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs text-danger font-bold font-sans">
        <span className="w-2 h-2 rounded-full bg-danger opacity-60" />
        OFFLINE
      </span>
    );
  };

  // Group users by current active workbook
  const workbookViewers = workbooks.map(wb => {
    const viewers = activePresences.filter(p => String(p.current_workbook_id) === String(wb.id));
    return {
      id: wb.id,
      name: wb.name,
      viewers
    };
  }).filter(item => item.viewers.length > 0);

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-sans font-black tracking-wider text-primary uppercase">
          User Presence
        </h1>
        <p className="text-muted font-sans text-sm">
          View active user connections and session information
        </p>
      </div>

      {isLoading ? (
        <div className="p-10 text-center font-sans text-muted animate-pulse border border-accent/15 bg-black/40 rounded-xl">
          Loading presence data...
        </div>
      ) : (
        <>
          {/* Stats Dashboard Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <CyberStatCard
              title="Online Operators"
              value={onlineUsers.length}
              variant="success"
              icon={<Users className="w-5 h-5 text-success" />}
            />
            <CyberStatCard
              title="Idle Connections"
              value={idleUsers.length}
              variant="warning"
              icon={<Activity className="w-5 h-5 text-warning" />}
            />
            <CyberStatCard
              title="Offline Registry"
              value={offlineUsers.length}
              variant="danger"
              icon={<UserMinus className="w-5 h-5 text-danger" />}
            />
            <CyberStatCard
              title="Active Workbooks"
              value={activeWorkbookIds.size}
              variant="primary"
              icon={<BookOpen className="w-5 h-5 text-primary" />}
            />
          </div>

          {/* User Activity List Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 border-b border-accent/20 pb-2">
              <Monitor className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-sans font-bold tracking-widest text-primary uppercase">
                Active Connections
              </h2>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden border border-accent/15 rounded-xl bg-black/45">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="border-b border-accent/20 bg-cyberCard/80 text-primary uppercase">
                    <th className="p-4">User</th>
                    <th className="p-4">Clearance</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Current Page</th>
                    <th className="p-4">Workbook</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4 text-right">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {activePresences.map((p) => (
                    <tr key={p.user_id} className="border-b border-accent/5 hover:bg-accent/5 transition-colors">
                      <td className="p-4 font-bold text-text">{p.username}</td>
                      <td className="p-4">
                        <CyberBadge variant="secondary">
                          {getUserRoleString(p.user_id)}
                        </CyberBadge>
                      </td>
                      <td className="p-4">{getStatusBadge(p.computedStatus)}</td>
                      <td className="p-4 text-theme-secondary flex items-center gap-1.5 pt-4">
                        <Compass className="w-3.5 h-3.5 text-accent/60" />
                        {p.current_page || "Dashboard"}
                      </td>
                      <td className="p-4 text-theme-muted">
                        {getWorkbookName(p.current_workbook_id)}
                      </td>
                      <td className="p-4 text-success font-bold flex items-center gap-1 pt-4">
                        <Clock className="w-3.5 h-3.5 text-success/60" />
                        {formatDuration(p.session_start)}
                      </td>
                      <td className="p-4 text-right text-theme-muted">
                        {new Date(p.last_seen).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                  {activePresences.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted italic">
                        No active operator connection signals detected.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Card View */}
            <div className="block md:hidden space-y-4">
              {activePresences.map((p) => (
                  <CyberCard key={p.user_id} className="space-y-3" variant={p.computedStatus === "online" ? "success" : "warning"}>
                  <div className="flex justify-between items-start border-b border-accent/10 pb-2">
                    <div>
                      <div className="font-bold text-sm text-text font-sans">{p.username}</div>
                      <div className="text-[10px] text-theme-muted mt-0.5 uppercase tracking-wider font-sans">
                        Clearance: {getUserRoleString(p.user_id)}
                      </div>
                    </div>
                    {getStatusBadge(p.computedStatus)}
                  </div>
                  <div className="grid grid-cols-2 gap-4 font-sans text-[11px] text-theme-secondary">
                    <div className="space-y-1">
                      <span className="text-[9px] text-theme-muted uppercase tracking-widest block">Page</span>
                      <span className="flex items-center gap-1"><Compass className="w-3 h-3 text-accent" /> {p.current_page || "Dashboard"}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-theme-muted uppercase tracking-widest block">Active Workbook</span>
                      <span className="truncate block max-w-[120px]">{getWorkbookName(p.current_workbook_id)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-theme-muted uppercase tracking-widest block">Session Time</span>
                      <span className="text-success font-bold flex items-center gap-1"><Clock className="w-3 h-3 text-success" /> {formatDuration(p.session_start)}</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-theme-muted uppercase tracking-widest block">Last Signal</span>
                      <span className="text-theme-muted">{new Date(p.last_seen).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </CyberCard>
              ))}
              {activePresences.length === 0 && (
                <div className="p-8 text-center text-muted font-sans italic border border-dashed border-accent/20 rounded-xl">
                  No active connections detected.
                </div>
              )}
            </div>
          </div>

          {/* Workbook Activity Display */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center space-x-2 border-b border-accent/20 pb-2">
              <Eye className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-sans font-bold tracking-widest text-primary uppercase">
                Active Workbooks
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workbookViewers.map((item) => (
                <CyberCard key={item.id} className="space-y-3" variant="primary">
                  <div className="flex items-center justify-between border-b border-accent/20 pb-2">
                    <span className="text-xs font-sans font-black text-primary uppercase truncate max-w-[200px]">
                      {item.name}
                    </span>
                    <CyberBadge variant="primary">
                      {item.viewers.length} {item.viewers.length === 1 ? "User" : "Users"}
                    </CyberBadge>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {item.viewers.map((viewer) => (
                      <div key={viewer.user_id} className="flex items-center justify-between p-2 bg-theme-card border border-accent/5 rounded font-sans text-[11px]">
                        <span className="font-bold text-text">{viewer.username}</span>
                        <span className="text-theme-muted">
                          Viewing: <span className="text-accent">{viewer.current_page}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </CyberCard>
              ))}
              {workbookViewers.length === 0 && (
                <div className="col-span-full p-8 text-center text-muted font-sans italic border border-dashed border-accent/20 rounded-xl bg-black/20">
                  No active workbooks are currently being viewed.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserPresence;
