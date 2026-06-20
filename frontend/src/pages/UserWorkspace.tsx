import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberStatCard } from "../components/ui/CyberStatCard";
import { PageHeader } from "../components/ui/PageHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { getAssignedWorkbooks, getWorkspaceNotes, getWorkspacePublicNotes } from "../services/workspaceService";
import { getWorksheets } from "../services/worksheetService";
import { getRows } from "../services/rowService";

const UserWorkspace: React.FC = () => {
  const { appUser } = useAuth();
  const [workbookNames, setWorkbookNames] = useState<Record<string, string>>({});

  const isSuperAdmin = appUser?.roles?.includes("SuperAdmin") ?? false;

  // Filter / search state
  const [filterWorkbook, setFilterWorkbook] = useState<string>("");
  const [filterSheet, setFilterSheet] = useState<string>("");
  const [filterAuthor, setFilterAuthor] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");
  const [searchRecordId, setSearchRecordId] = useState<string>("");

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

  const { data: publicNotesRaw = [] } = useQuery({
    queryKey: ["workspace-public-notes", appUser?.id, isSuperAdmin],
    queryFn: async () => {
      try {
        return await getWorkspacePublicNotes(appUser?.id?.toString() || "", isSuperAdmin);
      } catch {
        return [];
      }
    },
    enabled: !!appUser?.id,
  });

  const fetchAssignedSheets = async () => {
    if (!appUser?.id) return 0;
    const intUserId = Number(appUser.id);
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

    const intUserId = Number(appUser.id);
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

  // Derive filter options from raw data
  const workbookOptions = useMemo(() => {
    const ids = [...new Set(publicNotesRaw.map(n => n.workbook_id).filter(Boolean))];
    return ids.map(id => ({ value: String(id), label: publicNotesRaw.find(n => n.workbook_id === id)?.workbook_name || `Workbook #${id}` }));
  }, [publicNotesRaw]);

  const sheetOptions = useMemo(() => {
    let filtered = publicNotesRaw;
    if (filterWorkbook) {
      filtered = filtered.filter(n => String(n.workbook_id) === filterWorkbook);
    }
    const ids = [...new Set(filtered.map(n => n.sheet_id).filter(Boolean))];
    return ids.map(id => ({ value: String(id), label: filtered.find(n => n.sheet_id === id)?.sheet_name || `Sheet #${id}` }));
  }, [publicNotesRaw, filterWorkbook]);

  const authorOptions = useMemo(() => {
    const ids = [...new Set(publicNotesRaw.map(n => n.created_by).filter(Boolean))];
    return ids.map(id => ({ value: String(id), label: publicNotesRaw.find(n => n.created_by === id)?.author_name || `User #${id}` }));
  }, [publicNotesRaw]);

  // Apply filters + search
  const filteredNotes = useMemo(() => {
    let result = [...publicNotesRaw];

    if (filterWorkbook) {
      result = result.filter(n => String(n.workbook_id) === filterWorkbook);
    }
    if (filterSheet) {
      result = result.filter(n => String(n.sheet_id) === filterSheet);
    }
    if (filterAuthor) {
      result = result.filter(n => String(n.created_by) === filterAuthor);
    }
    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter(n => new Date(n.updated_at) >= from);
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter(n => new Date(n.updated_at) <= to);
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(n => n.note?.toLowerCase().includes(q));
    }
    if (searchRecordId) {
      const q = searchRecordId.toLowerCase();
      result = result.filter(n => String(n.record_id || "").toLowerCase().includes(q));
    }

    return result;
  }, [publicNotesRaw, filterWorkbook, filterSheet, filterAuthor, dateFrom, dateTo, searchText, searchRecordId]);

  // Summary stats
  const notesUpdatedToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return filteredNotes.filter(n => {
      const updated = new Date(n.updated_at);
      return updated >= today;
    }).length;
  }, [filteredNotes]);

  const activeContributors = useMemo(() => {
    return new Set(filteredNotes.map(n => n.created_by)).size;
  }, [filteredNotes]);

  const handleNoteClick = (note: any) => {
    if (note.sheet_id && note.record_id) {
      window.location.href = `/workbooks/${note.workbook_id}/sheets/${note.sheet_id}/records/${note.record_id}`;
    } else if (note.sheet_id) {
      window.location.href = `/worksheets/${note.sheet_id}`;
    } else if (note.workbook_id) {
      window.location.href = `/workspace/workbook/${note.workbook_id}`;
    }
  };

  const handleCopyRecordId = (e: React.MouseEvent, recordId: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(recordId);
  };

  const handleViewWorkbook = (e: React.MouseEvent, workbookId: number) => {
    e.stopPropagation();
    window.location.href = `/workspace/workbook/${workbookId}`;
  };

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

      {/* Public Notes Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <CyberStatCard
          title="Total Public Notes"
          value={filteredNotes.length}
          variant="primary"
        />
        <CyberStatCard
          title="Updated Today"
          value={notesUpdatedToday}
          variant="success"
        />
        <CyberStatCard
          title="Active Contributors"
          value={activeContributors}
          variant="secondary"
        />
      </div>

      {/* Assigned Workbooks */}
      <CyberCard>
        <h3 className="text-primary font-mono text-sm font-bold uppercase tracking-wider mb-4">
          Assigned Workbooks
        </h3>
        {assignedWorkbooks.length === 0 ? (
          <p className="text-theme-muted text-xs">No workbooks assigned yet. Contact SuperAdmin to request access.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {assignedWorkbooks.map((wb) => (
              <div
                key={wb}
                className="p-3 border border-accent/20 rounded bg-theme-card/50 hover:bg-accent/10 transition-all cursor-pointer"
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
          <p className="text-theme-muted text-xs">No notes available.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {workspaceNotes.slice(0, 5).map((note: any) => (
              <div key={note.id} className="p-2 border-b border-accent/10">
                <div className="text-xs font-sans text-primary font-bold">{note.note?.substring(0, 50)}</div>
                <div className="text-[10px] text-theme-muted truncate">{note.note}</div>
              </div>
            ))}
          </div>
        )}
      </CyberCard>

      {/* Public Notes Feed */}
      <CyberCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary font-mono text-sm font-bold uppercase tracking-wider">
            Public Notes Feed
          </h3>
          <span className="text-[10px] font-mono text-theme-muted">
            {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
          <select
            value={filterWorkbook}
            onChange={e => { setFilterWorkbook(e.target.value); setFilterSheet(""); }}
            className="w-full p-1.5 bg-theme-card text-slate-200 border border-accent/30 rounded text-[11px] font-mono focus:outline-none focus:border-accent"
          >
            <option value="">All Workbooks</option>
            {workbookOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filterSheet}
            onChange={e => setFilterSheet(e.target.value)}
            className="w-full p-1.5 bg-theme-card text-slate-200 border border-accent/30 rounded text-[11px] font-mono focus:outline-none focus:border-accent"
          >
            <option value="">All Sheets</option>
            {sheetOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filterAuthor}
            onChange={e => setFilterAuthor(e.target.value)}
            className="w-full p-1.5 bg-theme-card text-slate-200 border border-accent/30 rounded text-[11px] font-mono focus:outline-none focus:border-accent"
          >
            <option value="">All Authors</option>
            {authorOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            placeholder="From"
            className="w-full p-1.5 bg-theme-card text-slate-200 border border-accent/30 rounded text-[11px] font-mono focus:outline-none focus:border-accent"
          />

          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            placeholder="To"
            className="w-full p-1.5 bg-theme-card text-slate-200 border border-accent/30 rounded text-[11px] font-mono focus:outline-none focus:border-accent"
          />
        </div>

        {/* Search Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="Search note text..."
            className="w-full p-1.5 bg-theme-card text-slate-200 border border-accent/30 rounded text-[11px] font-mono focus:outline-none focus:border-accent"
          />
          <input
            type="text"
            value={searchRecordId}
            onChange={e => setSearchRecordId(e.target.value)}
            placeholder="Search record ID..."
            className="w-full p-1.5 bg-theme-card text-slate-200 border border-accent/30 rounded text-[11px] font-mono focus:outline-none focus:border-accent"
          />
        </div>

        {/* Notes List */}
        {filteredNotes.length === 0 ? (
          <p className="text-theme-muted text-xs">No public notes found matching the current filters.</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {filteredNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleNoteClick(note)}
                className="group relative p-3 border border-accent/10 rounded bg-theme-card/50 hover:bg-accent/10 hover:border-accent/40 transition-all cursor-pointer"
              >
                {/* Hover indicator */}
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[9px] font-mono text-accent uppercase tracking-wider flex items-center gap-1">
                    Open Record <span className="text-xs">→</span>
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-200 text-xs font-mono whitespace-pre-wrap break-words line-clamp-3 group-hover:text-slate-100 transition-colors">
                      {note.note}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] font-mono text-theme-muted">
                      {note.record_id && (
                        <span className="text-accent/80">Record: {note.record_id}</span>
                      )}
                      <span>Workbook: {note.workbook_name}</span>
                      <span>Sheet: {note.sheet_name}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] font-mono text-theme-muted">{note.author_name}</div>
                    <div className="text-[9px] font-mono text-slate-600 mt-1">
                      <div>Created: {note.created_at ? new Date(note.created_at).toLocaleDateString() : "-"}</div>
                      <div>Updated: {note.updated_at ? new Date(note.updated_at).toLocaleDateString() : "-"}</div>
                    </div>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex gap-3 mt-2 pt-2 border-t border-accent/5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {note.record_id && (
                    <button
                      onClick={(e) => handleCopyRecordId(e, note.record_id)}
                      className="text-[9px] font-mono text-theme-muted hover:text-accent uppercase tracking-wider"
                    >
                      Copy Record ID
                    </button>
                  )}
                  {note.workbook_id && (
                    <button
                      onClick={(e) => handleViewWorkbook(e, note.workbook_id)}
                      className="text-[9px] font-mono text-theme-muted hover:text-accent uppercase tracking-wider"
                    >
                      View Workbook
                    </button>
                  )}
                </div>
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
          <p className="text-theme-muted text-xs">No recent activity.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {recentActivity.map((log: any) => (
              <div
                key={log.id}
                className="p-2 border-b border-accent/10 text-xs font-sans text-theme-muted"
              >
                <span className="text-primary">{log.action}</span>
                <span className="ml-2 text-theme-muted">
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