import React, { useEffect, useState } from "react";
import { getAllAuditLogs } from "../services/auditService";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberInput } from "../components/ui/CyberInput";
import { CyberBadge } from "../components/ui/CyberBadge";
import { PageHeader } from "../components/ui/PageHeader";

export const AuditHistory: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setIsLoading(true);
        const data = await getAllAuditLogs();
        setLogs(data || []);
        setFilteredLogs(data || []);
      } catch (err) {
        console.error("Failed to load audit history:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadLogs();
  }, []);

  useEffect(() => {
    let result = logs;

    // Filter by search
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter(
        (l) =>
          String(l.user_id).toLowerCase().includes(term) ||
          String(l.action).toLowerCase().includes(term) ||
          JSON.stringify(l.payload).toLowerCase().includes(term)
      );
    }

    // Filter by action group
    if (actionFilter !== "all") {
      result = result.filter((l) => l.action.includes(actionFilter));
    }

    setFilteredLogs(result);
  }, [search, actionFilter, logs]);

  const getActionBadgeVariant = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes("delete") || act.includes("remove")) return "danger";
    if (act.includes("create") || act.includes("upload") || act.includes("add")) return "success";
    if (act.includes("edit") || act.includes("update") || act.includes("assign")) return "warning";
    return "primary";
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Audit Console"
        subtitle="Cryptographic telemetry trails tracking operator logins, workbook ingestions, deletions, and role assignments"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Controls Deck */}
        <div className="lg:col-span-1 space-y-6">
          <CyberCard className="space-y-4">
            <h2 className="text-sm font-sans font-bold tracking-widest text-primary uppercase border-b border-accent/25 pb-2">
              Log Search Filters
            </h2>
            
            <div className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-theme-muted uppercase font-bold tracking-wider">Search Logs</label>
                <CyberInput
                  type="text"
                  placeholder="Search metadata, IDs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-theme-muted uppercase font-bold tracking-wider">Action Type</label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-theme-card border border-accent/20 text-text text-xs focus:outline-none focus:border-primary rounded-lg transition-all"
                >
                  <option value="all">ALL TELEMETRY ACTIONS</option>
                  <option value="login">OPERATOR LOGINS</option>
                  <option value="upload">WORKBOOK UPLOADS</option>
                  <option value="delete">DELETIONS</option>
                  <option value="create">CREATION ACTIONS</option>
                  <option value="role">ROLE ASSIGNMENTS</option>
                </select>
              </div>
            </div>
          </CyberCard>

          <CyberCard variant="secondary" className="hidden lg:block space-y-3 font-sans text-[10px] text-theme-muted">
            <div>[STATUS] SECURITY TELEMETRY ONLINE</div>
            <div>[TRAILS] MAPPED LOCALLY AND SYNCED WITH SUPABASE</div>
            <div>[OPERATOR] SUPERADMIN PRIVILEGES INITIATED</div>
          </CyberCard>
        </div>

        {/* Audit Log Table */}
        <div className="lg:col-span-3">
          <CyberCard className="space-y-4">
            <h2 className="text-sm font-sans font-bold tracking-widest text-primary uppercase border-b border-accent/25 pb-2">
              Audit Trails Feed
            </h2>

            {isLoading ? (
              <div className="py-12 text-center text-xs font-sans text-muted animate-pulse">
                Decrypting remote audit structures...
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-xs font-sans text-muted border border-dashed border-accent/10 rounded-xl">
                No audited actions detected in the logging index.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-accent/20 text-primary uppercase text-[10px]">
                      <th className="py-3 px-2">Timestamp</th>
                      <th className="py-3 px-2">Operator ID</th>
                      <th className="py-3 px-2">Action</th>
                      <th className="py-3 px-2 text-right">Details / Context</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-accent/5 hover:bg-accent/5 transition-colors"
                      >
                        <td className="py-3 px-2 text-theme-muted">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-2 font-bold text-text">
                          Node #{log.user_id || "System"}
                        </td>
                        <td className="py-3 px-2">
                          <CyberBadge variant={getActionBadgeVariant(log.action)}>
                            {log.action.toUpperCase()}
                          </CyberBadge>
                        </td>
                        <td className="py-3 px-2 text-right text-theme-secondary max-w-xs truncate">
                          {log.payload?.new_value || log.payload?.old_value || JSON.stringify(log.payload)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CyberCard>
        </div>
      </div>
    </div>
  );
};

export default AuditHistory;
