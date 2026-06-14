import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { getWorksheets, Worksheet } from "../services/worksheetService";
import { getRows, resolveRecordTable } from "../services/rowService";
import { getColumns } from "../services/worksheetService";
import { PageHeader } from "../components/ui/PageHeader";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberButton } from "../components/ui/CyberButton";
import { CyberStatCard } from "../components/ui/CyberStatCard";

const WorkspaceWorkbook: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workbookName, setWorkbookName] = useState<string>("");

  const fetchWorkbook = async () => {
    if (!id) return null;
    const { data, error } = await supabase
      .from("workbooks")
      .select("name")
      .eq("id", parseInt(id))
      .single();
    if (error) return null;
    return data;
  };

  const { data: workbook } = useQuery({
    queryKey: ["workspace-workbook", id],
    queryFn: fetchWorkbook,
    enabled: !!id,
  });

  useEffect(() => {
    if (workbook?.name) setWorkbookName(workbook.name);
  }, [workbook]);

  const { data: worksheets = [] } = useQuery({
    queryKey: ["workspace-workbook-sheets", id],
    queryFn: async () => {
      if (!id) return [];
      try {
        return await getWorksheets(id);
      } catch {
        return [];
      }
    },
    enabled: !!id,
  });

  const fetchSheetStats = async (sheetId: string): Promise<{ row_count: number; col_count: number }> => {
    try {
      const resolvedTable = await resolveRecordTable(sheetId);
      const [rows, cols] = await Promise.all([
        getRows(sheetId),
        getColumns(sheetId).catch(() => [])
      ]);
      return { row_count: rows.length, col_count: cols.length };
    } catch {
      return { row_count: 0, col_count: 0 };
    }
  };

  const [sheetStats, setSheetStats] = useState<Record<string, { row_count: number; col_count: number }>>({});

  useEffect(() => {
    if (worksheets.length > 0) {
      const loadStats = async () => {
        const stats: Record<string, { row_count: number; col_count: number }> = {};
        for (const ws of worksheets) {
          stats[ws.id] = await fetchSheetStats(ws.id);
        }
        setSheetStats(stats);
      };
      loadStats();
    }
  }, [worksheets]);

  const handleSheetSelect = (sheetId: string) => {
    navigate(`/worksheets/${sheetId}`);
  };

  const totalRows = Object.values(sheetStats).reduce((sum, s) => sum + s.row_count, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Workspace Workbook" subtitle={`Working with: ${workbookName || id}`} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CyberStatCard title="Total Sheets" value={worksheets.length} variant="primary" />
        <CyberStatCard title="Total Rows" value={totalRows} variant="success" />
        <CyberStatCard title="Workbook ID" value={id ? `#${id.substring(0, 8)}` : "-"} variant="secondary" />
      </div>

      <CyberCard>
        <h3 className="text-primary font-mono text-sm font-bold uppercase tracking-wider mb-4">
          Available Sheets
        </h3>
        {worksheets.length === 0 ? (
          <p className="text-slate-400 text-xs">No sheets found in this workbook.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {worksheets.map((ws) => {
              const stats = sheetStats[ws.id] || { row_count: 0, col_count: 0 };
              return (
                <div
                  key={ws.id}
                  className="p-4 border border-cyan-500/20 rounded bg-cyberCard/50 hover:bg-cyan-500/10 transition-all cursor-pointer"
                  onClick={() => handleSheetSelect(ws.id)}
                >
                  <div className="text-slate-200 font-mono text-sm font-bold truncate mb-2">
                    {ws.name}
                  </div>
                  <div className="text-slate-400 text-xs space-y-1">
                    <div>Records: {stats.row_count}</div>
                    <div>Columns: {stats.col_count}</div>
                    <div className="text-primary/60 truncate">Last: {ws.updated_at ? new Date(ws.updated_at).toLocaleDateString() : "Never"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CyberCard>

      <div className="flex justify-end">
        <CyberButton variant="secondary" onClick={() => navigate("/workspace")}>
          ← Back to Workspace
        </CyberButton>
      </div>
    </div>
  );
};

export default WorkspaceWorkbook;