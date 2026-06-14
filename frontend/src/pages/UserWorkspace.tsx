import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberStatCard } from "../components/ui/CyberStatCard";
import { PageHeader } from "../components/ui/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { getAssignedWorkbooks, getWorkspaceNotes } from "../services/workspaceService";
import { getWorksheets } from "../services/worksheetService";
import { getRows } from "../services/rowService";

const UserWorkspace: React.FC = () => {
  const { appUser } = useAuth();
  const [workbookNames, setWorkbookNames] = useState<Record<string, string>>({});

  const { data: assignedWorkbooks = [] } = useQuery({
    queryKey: ["workspace-assigned-workbooks", appUser?.id],
    queryFn: async () => {
      try {
        return await getAssignedWorkbooks(appUser?.id || "");
      } catch {
        return [];
      }
    },
    enabled: !!appUser?.id,
  });

  const { data: workspaceNotes = [] } = useQuery({
    queryKey: ["workspace-notes", appUser?.id],
    queryFn: async () => {
      try {
        return await getWorkspaceNotes(appUser?.id || "");
      } catch {
        return [];
      }
    },
    enabled: !!appUser?.id,
  });

  const fetchAssignedSheets = async () => {
    if (!appUser?.id) return 0;

    const intUserId = parseInt(appUser.id);
    if (isNaN(intUserId)) return 0;

    const { data: assignments, error: assignErr } = await supabase
      .from("workspace_assignments")
      .select("workbook_id")
      .eq("user_id", intUserId);

    if (assignErr) return 0;

    const workbookIds = [...new Set(assignments?.map((a: any) => a.workbook_id) || [])];

    let totalRows = 0;
    for (const wbId of workbookIds) {
      try {
        const sheets = await getWorksheets(String(wbId));
        for (const sheet of sheets) {
          const rows = await getRows(sheet.id);
          totalRows += rows.length;
        }
      } catch {
        // ignore
      }
    }

    return totalRows;
  };

  const { data: assignedSheets = 0 } = useQuery({
    queryKey: ["workspace-assigned-sheets", appUser?.id],
    queryFn: fetchAssignedSheets,
    enabled: !!appUser?.id,
  });

  const fetchRecentActivity = async () => {
    if (!appUser?.id) return [];

    const intUserId = parseInt(appUser.id);
    if (isNaN(intUserId)) return [];

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", intUserId)
      .order("timestamp", { ascending: false })
      .limit(10);

    if (error) return [];
    return data || [];
  };

  const { data: recentActivity = [] } = useQuery({
    queryKey: ["workspace-recent-activity", appUser?.id],
    queryFn: fetchRecentActivity,
    enabled: !!appUser?.id,
  });

  // Fetch workbook names
  useEffect(() => {
    if (assignedWorkbooks.length > 0) {
      const fetchNames = async () => {
        const names: Record<string, string> = {};
        try {
          const { data } = await supabase
            .from("workbooks")
            .select("id, name")
            .in("id", assignedWorkbooks.map(wb => parseInt(wb)));
          data?.forEach((wb: any) => {
            names[wb.id.toString()] = wb.name;
          });
        } catch {
          // ignore
        }
        setWorkbookNames(names);
      };
      fetchNames();
    }
  }, [assignedWorkbooks]);

  return (
    <div className="space-y-6">
      <PageHeader title="User Workspace" subtitle="Your assigned resources and recent activity" />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CyberStatCard
          title="Assigned Workbooks"
          value={assignedWorkbooks.length}
          variant="primary"
        />
        <CyberStatCard
          title="Assigned Sheets"
          value={assignedSheets}
          variant="success"
        />
        <CyberStatCard
          title="My Notes"
          value={workspaceNotes.length}
          variant="secondary"
        />
        <CyberStatCard
          title="Recent Actions"
          value={recentActivity.length}
          variant="warning"
        />
      </div>

      {/* Assigned Workbooks */}
      <CyberCard>
        <h3 className="text-primary font-mono text-sm font-bold uppercase tracking-wider mb-4">
          Assigned Workbooks
        </h3>
        {assignedWorkbooks.length === 0 ? (
          <p className="text-slate-400 text-xs">No workbooks assigned yet. Contact SuperAdmin to request access.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignedWorkbooks.map((wb) => (
              <div
                key={wb}
                className="p-3 border border-cyan-500/20 rounded bg-cyberCard/50 hover:bg-cyan-500/10 transition-all cursor-pointer"
                onClick={() => {
                  window.location.href = `/workspace/workbook/${wb}`;
                }}
              >
                <span className="text-slate-200 font-mono text-xs truncate block">
                  {workbookNames[wb] || `Workbook #${wb.substring(0, 8)}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </CyberCard>

      {/* User Notes */}
      <CyberCard>
        <h3 className="text-primary font-mono text-sm font-bold uppercase tracking-wider mb-4">
          My Notes
        </h3>
        {workspaceNotes.length === 0 ? (
          <p className="text-slate-400 text-xs">No notes available.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {workspaceNotes.slice(0, 5).map((note: any) => (
              <div key={note.id} className="p-2 border-b border-cyan-500/10">
                <div className="text-xs font-mono text-primary font-bold">{note.title}</div>
                <div className="text-[10px] text-slate-400 truncate">{note.content}</div>
              </div>
            ))}
          </div>
        )}
      </CyberCard>

      {/* Recent Activity */}
      <CyberCard>
        <h3 className="text-primary font-mono text-sm font-bold uppercase tracking-wider mb-4">
          Recent Activity
        </h3>
        {recentActivity.length === 0 ? (
          <p className="text-slate-400 text-xs">No recent activity.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {recentActivity.map((log: any) => (
              <div
                key={log.id}
                className="p-2 border-b border-cyan-500/10 text-xs font-mono text-slate-400"
              >
                <span className="text-primary">{log.action}</span>
                <span className="ml-2 text-slate-500">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CyberCard>
    </div>
  );
};

export default UserWorkspace;