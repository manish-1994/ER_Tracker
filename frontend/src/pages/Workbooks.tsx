import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWorkbooks, createWorkbook, updateWorkbook, deleteWorkbook, verifyWorkbookDeleted } from "../services/workbookService";
import { createWorksheet, getWorksheets } from "../services/worksheetService";
import { createRow, createRowsBulk } from "../services/rowService";
import { supabase } from "../services/supabaseClient";
import { PageHeader } from "../components/ui/PageHeader";
import { CyberTable, PremiumColumn } from "../components/ui/CyberTable";
import { CyberButton } from "../components/ui/CyberButton";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberInput } from "../components/ui/CyberInput";
import { CyberModal } from "../components/ui/CyberModal";
import CyberProgressModal from "../components/ui/CyberProgressModal";
import { CyberSelect } from "../components/ui/CyberSelect";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import * as XLSX from "xlsx";
import { SheetSelector } from "../components/SheetSelector";
import { getWorkspaceAssignments, assignWorkbook, getAssignableUsers, AssignableUser } from "../services/workspaceService";
import { Grid, List, Eye, Edit3, UserPlus, Trash2, Clock, BookOpen, Layers } from "lucide-react";

const Workbooks = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { appUser } = useAuth();
  
  const [importState, setImportState] = useState({
    isOpen: false,
    progress: 0,
    step: "Analyzing Workbook",
    currentSheet: "",
    currentRow: 0,
    totalRows: 0,
    sheetsProcessed: 0,
    totalSheets: 0,
    elapsed: 0,
  });
  
  const [importResult, setImportResult] = useState<string>("");
  const [importError, setImportError] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  
  const [isSelectorOpen, setSelectorOpen] = useState(false);
  const [selectedWbIdForSelector, setSelectedWbIdForSelector] = useState<string>("");
  
  const [renameWorkbookId, setRenameWorkbookId] = useState<string | null>(null);
  const [renameWorkbookName, setRenameWorkbookName] = useState<string>("");
  const [isRenameOpen, setRenameOpen] = useState(false);
  
  const [deleteWorkbookId, setDeleteWorkbookId] = useState<string | null>(null);
  const [deleteWorkbookName, setDeleteWorkbookName] = useState<string>("");
  const [isDeleteOpen, setDeleteOpen] = useState(false);
  
  const [assignWbId, setAssignWbId] = useState<string | null>(null);
  const [assignWbName, setAssignWbName] = useState<string>("");
  const [isAssignOpen, setAssignOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AssignableUser | null>(null);
  const [assignCanEdit, setAssignCanEdit] = useState(true);
  const [assignCanDelete, setAssignCanDelete] = useState(false);
  const [assignCanExport, setAssignCanExport] = useState(true);
  const [assignNotesEnabled, setAssignNotesEnabled] = useState(true);
  const [assignEntireWorkbook, setAssignEntireWorkbook] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [assignSuccess, setAssignSuccess] = useState<AssignableUser | null>(null);
  
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [workbookStats, setWorkbookStats] = useState<Record<string, { sheetsCount: number; rowsCount: number; lastModified: string }>>({});
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchWorkbooks = async () => await getWorkbooks();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["workbooks"], queryFn: fetchWorkbooks });

  useEffect(() => {
    if (!data || data.length === 0) return;
    const loadStats = async () => {
      setStatsLoading(true);
      try {
        const { data: sheets } = await supabase.from("sheets").select("id, workbook_id, name");
        const statsMap: Record<string, { sheetsCount: number; rowsCount: number; lastModified: string }> = {};
        data.forEach((wb: any) => {
          statsMap[wb.id] = { sheetsCount: 0, rowsCount: 0, lastModified: new Date().toISOString() };
        });
        await Promise.all((sheets || []).map(async (sheet) => {
          const wbId = sheet.workbook_id;
          if (!statsMap[wbId]) return;
          statsMap[wbId].sheetsCount += 1;
          try {
            const { count } = await supabase.from(`records_${sheet.id}`).select("*", { count: "exact", head: true });
            if (count !== null) statsMap[wbId].rowsCount += count;
          } catch {}
        }));
        setWorkbookStats(statsMap);
      } catch {}
      setStatsLoading(false);
    };
    loadStats();
  }, [data]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    setImportResult("");
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setImportError("Unsupported format. Please upload .xlsx, .xls, or .csv files.");
      return;
    }
    setImportState({ isOpen: true, progress: 5, step: "Analyzing Workbook", currentSheet: "", currentRow: 0, totalRows: 0, sheetsProcessed: 0, totalSheets: 0, elapsed: 0 });
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      if (!workbook.SheetNames.length) {
        setImportError("Empty workbook file.");
        setImportState(prev => ({ ...prev, isOpen: false }));
        return;
      }
      const updateProgress = (progress: number, step: string, details?: Partial<typeof importState>) => {
        setImportState(prev => ({ ...prev, progress, step, elapsed: Math.floor((Date.now() - (prev.elapsed ? Date.now() : Date.now())) / 1000), ...details }));
      };
      updateProgress(15, "Detecting Sheets", { totalSheets: workbook.SheetNames.length });
      updateProgress(25, "Creating Workbook Record");
      const wbRecord = await createWorkbook(file.name);
      let totalRows = 0;
      for (let i = 0; i < workbook.SheetNames.length; i++) {
        const sheetName = workbook.SheetNames[i];
        const ws = workbook.Sheets[sheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (jsonRows.length === 0) continue;
        updateProgress(25 + ((i + 1) / workbook.SheetNames.length) * 20, "Importing Sheets", { currentSheet: sheetName, sheetsProcessed: i + 1 });
        const wsRecord = await createWorksheet(wbRecord.id, sheetName);
        const headerRow = (jsonRows[0] as any[]) || [];
        await Promise.all(headerRow.map((col, idx) => 
          supabase.from("columns").insert({ sheet_id: wsRecord.id, name: col || `Column ${idx}`, inferred_type: "text", is_hidden: false, display_order: idx })
        ));
        const rowBatch = (jsonRows.slice(1) as any[][]).map(row => {
          const rowData: Record<string, any> = {};
          headerRow.forEach((col, idx) => {
            const key = (col || `col_${idx}`).replace(/[^0-9a-zA-Z_]/g, '_').toLowerCase();
            rowData[key] = row[idx] ?? "";
          });
          return rowData;
        });
        totalRows += rowBatch.length;
        if (rowBatch.length > 0) await createRowsBulk(wsRecord.id, rowBatch);
      }
      updateProgress(95, "Finalizing");
      setImportResult(`Imported ${workbook.SheetNames.length} sheet(s), ${totalRows} rows.`);
      toast.success(`Workbook ingested: ${file.name}`);
      refetch();
      setTimeout(() => setImportState(prev => ({ ...prev, isOpen: false })), 3000);
    } catch (err: any) {
      setImportError(err.message || "Failed to ingest");
      setImportState(prev => ({ ...prev, isOpen: false }));
    }
  };

  const openRenameModal = (workbookId: string, currentName: string) => {
    setRenameWorkbookId(workbookId);
    setRenameWorkbookName(currentName);
    setRenameOpen(true);
  };

  const saveWorkbookRename = async () => {
    if (!renameWorkbookId) return;
    try {
      await updateWorkbook(renameWorkbookId, { name: renameWorkbookName });
      toast.success("Workbook renamed");
      refetch();
      setRenameOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to rename");
    }
  };

  const openAssignModal = async (workbookId: string, workbookName: string) => {
    setAssignWbId(workbookId);
    setAssignWbName(workbookName);
    setUsersLoading(true);
    try {
      setUsers(await getAssignableUsers());
    } catch (err: any) {
      setUsersError(err.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
    setAssignOpen(true);
  };

  const saveAssignWorkbook = async () => {
    if (!assignWbId || !selectedUser) {
      toast.warning("Select a user");
      return;
    }
    try {
      await assignWorkbook(selectedUser.id, assignWbId, appUser?.id?.toString() || "admin", {
        can_edit: assignCanEdit, can_delete: assignCanDelete, can_export: assignCanExport, notes_enabled: assignNotesEnabled
      });
      setAssignSuccess(selectedUser);
    } catch (err: any) {
      toast.error(err.message || "Assignment failed");
    }
  };

  const handleDeleteWorkbook = async () => {
    if (!deleteWorkbookId) return;
    try {
      await deleteWorkbook(deleteWorkbookId, deleteWorkbookName, appUser?.id?.toString());
      toast.success("Workbook deleted");
      refetch();
      setDeleteOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    }
  };

  const handleInspectWorkbook = (workbookId: string) => {
    setSelectedWbIdForSelector(workbookId);
    setSelectorOpen(true);
  };

  const columns: PremiumColumn[] = [
    {
      header: "Workbook",
      accessor: "name",
      render: (row) => <span className="font-semibold text-primary">{row.name}</span>,
    },
    {
      header: "Date",
      accessor: "uploaded_at",
      render: (row) => <span className="text-secondary text-xs">{row.uploaded_at ? new Date(row.uploaded_at).toLocaleString() : "-"}</span>,
    },
  ];

  const filteredData = (data || []).filter((wb: any) => wb.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-sans font-bold tracking-tight text-textPrimary">Workbooks</h1>
        <p className="text-secondary font-sans text-sm">Import, manage and configure spreadsheet workbooks</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <CyberCard className="space-y-4">
            <h2 className="text-md font-sans font-semibold text-textPrimary border-b border-secondary/20 pb-2">Import Workbook</h2>
            <p className="text-xs text-secondary">Select a .xlsx, .xls, or .csv file to import.</p>

            <label className="flex flex-col items-center justify-center border border-dashed border-secondary/30 rounded-lg p-6 cursor-pointer hover:border-primary/30 transition-colors">
              <span className="text-2xl mb-2">📄</span>
              <span className="text-xs font-semibold text-primary">Select Spreadsheet</span>
              <span className="text-[10px] text-secondary">XLSX/XLS/CSV supported</span>
              <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" disabled={importState.isOpen} />
            </label>

            {importState.isOpen && <CyberProgressModal isOpen={importState.isOpen} progress={importState.progress} step={importState.step} elapsedTime={importState.elapsed} />}
          </CyberCard>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <CyberCard className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-secondary/20 pb-3">
              <h2 className="text-md font-sans font-semibold text-textPrimary">Workbooks</h2>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="w-full sm:w-60">
                  <CyberInput type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex border border-secondary/20 rounded-lg p-0.5 bg-[var(--surface)]">
                  <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-primary/10 text-primary" : "text-secondary"}`}>
                    <Grid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition-all ${viewMode === "table" ? "bg-primary/10 text-primary" : "text-secondary"}`}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-10 text-center font-sans text-secondary">Loading...</div>
            ) : error ? (
              <div className="p-10 text-center font-sans text-danger">Failed to load.</div>
            ) : filteredData.length === 0 ? (
              <div className="p-10 text-center font-sans text-secondary border border-dashed border-secondary/20 rounded-lg">No workbooks found.</div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredData.map((wb: any) => (
                  <div key={wb.id} className="glass-panel rounded-xl p-5 flex flex-col justify-between h-48 hover:shadow-lg transition-all">
                    <div>
                      <h3 className="font-semibold text-textPrimary flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-secondary" />{wb.name}</h3>
                      <div className="mt-3 text-xs text-secondary">
                        <div className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{(workbookStats[wb.id]?.sheetsCount || 0)} Sheets</div>
                        <div>{(workbookStats[wb.id]?.rowsCount || 0).toLocaleString()} Rows</div>
                      </div>
                    </div>
                    <div className="border-t border-secondary/20 pt-3 mt-auto flex justify-between">
                      <span className="text-[9px] text-secondary flex items-center gap-1"><Clock className="w-3 h-3" />{wb.uploaded_at ? new Date(wb.uploaded_at).toLocaleDateString() : "-"}</span>
                      <div className="flex gap-1">
                        <button onClick={() => handleInspectWorkbook(wb.id)} className="p-1.5 rounded bg-secondary/10 hover:bg-secondary/20" title="View"><Eye className="w-3.5 h-3.5 text-secondary" /></button>
                        <button onClick={() => openRenameModal(wb.id, wb.name)} className="p-1.5 rounded bg-primary/10 hover:bg-primary/20" title="Rename"><Edit3 className="w-3.5 h-3.5 text-primary" /></button>
                        <button onClick={() => openAssignModal(wb.id, wb.name)} className="p-1.5 rounded bg-success/10 hover:bg-success/20" title="Assign"><UserPlus className="w-3.5 h-3.5 text-success" /></button>
                        <button onClick={() => { setDeleteWorkbookId(wb.id); setDeleteWorkbookName(wb.name); setDeleteOpen(true); }} className="p-1.5 rounded bg-danger/10 hover:bg-danger/20" title="Delete"><Trash2 className="w-3.5 h-3.5 text-danger" /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <CyberTable
                columns={columns}
                data={filteredData}
                actions={(row) => (
                  <div className="flex gap-1.5">
                    <CyberButton size="sm" variant="secondary" onClick={() => openRenameModal(row.id, row.name)}>✎</CyberButton>
                    <CyberButton size="sm" variant="primary" onClick={() => handleInspectWorkbook(row.id)}>View</CyberButton>
                    <CyberButton size="sm" variant="secondary" onClick={() => openAssignModal(row.id, row.name)}>Assign</CyberButton>
                    <CyberButton size="sm" variant="danger" onClick={() => { setDeleteWorkbookId(row.id); setDeleteWorkbookName(row.name); setDeleteOpen(true); }}>Delete</CyberButton>
                  </div>
                )}
              />
            )}
          </CyberCard>
        </div>
      </div>

      <CyberModal isOpen={isRenameOpen} onClose={() => setRenameOpen(false)} title="Rename Workbook">
        <div className="space-y-4 font-sans text-xs">
          <CyberInput type="text" value={renameWorkbookName} onChange={(e) => setRenameWorkbookName(e.target.value)} />
          <div className="flex justify-end gap-3 pt-4 border-t border-secondary/20">
            <CyberButton variant="secondary" onClick={() => setRenameOpen(false)}>Cancel</CyberButton>
            <CyberButton variant="primary" onClick={saveWorkbookRename}>Save</CyberButton>
          </div>
        </div>
      </CyberModal>

      <CyberModal isOpen={isDeleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Workbook">
        <div className="space-y-4 font-sans text-xs">
          <p className="text-secondary">This action cannot be undone. All data will be removed.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-secondary/20">
            <CyberButton variant="secondary" onClick={() => setDeleteOpen(false)}>Cancel</CyberButton>
            <CyberButton variant="danger" onClick={handleDeleteWorkbook}>Delete</CyberButton>
          </div>
        </div>
      </CyberModal>

      <SheetSelector isOpen={isSelectorOpen} onClose={() => setSelectorOpen(false)} workbookId={selectedWbIdForSelector} onSelect={(sheetId) => { setSelectorOpen(false); navigate(`/worksheets/${sheetId}`); }} />

      <CyberModal isOpen={isAssignOpen} onClose={() => setAssignOpen(false)} title="Assign Workbook">
        <div className="space-y-4 font-sans text-xs">
          {assignSuccess ? (
            <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
              <div className="text-xs font-bold text-success mb-2">Success</div>
              <div className="text-[10px] text-secondary">Assigned to: {assignSuccess.username || assignSuccess.email}</div>
            </div>
          ) : usersLoading ? (
            <div className="p-3 text-center text-secondary">Loading users...</div>
          ) : (
            <div className="space-y-3">
              <CyberSelect placeholder="Select user..." value={selectedUser?.id || ""} onChange={(e) => setSelectedUser(users.find(u => u.id === e.target.value) || null)} options={users.map(u => ({ value: u.id, label: u.username || u.email }))} />
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 text-secondary"><input type="checkbox" checked={assignCanEdit} onChange={(e) => setAssignCanEdit(e.target.checked)} className="accent-primary" />Can Edit</label>
                <label className="flex items-center gap-2 text-secondary"><input type="checkbox" checked={assignCanDelete} onChange={(e) => setAssignCanDelete(e.target.checked)} className="accent-primary" />Can Delete</label>
                <label className="flex items-center gap-2 text-secondary"><input type="checkbox" checked={assignCanExport} onChange={(e) => setAssignCanExport(e.target.checked)} className="accent-primary" />Can Export</label>
                <label className="flex items-center gap-2 text-secondary"><input type="checkbox" checked={assignNotesEnabled} onChange={(e) => setAssignNotesEnabled(e.target.checked)} className="accent-primary" />Notes</label>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-secondary/20">
            <CyberButton variant={assignSuccess ? "secondary" : "secondary"} onClick={() => setAssignOpen(false)}>{assignSuccess ? "Close" : "Cancel"}</CyberButton>
            {!assignSuccess && <CyberButton variant="primary" onClick={saveAssignWorkbook} disabled={!selectedUser}>Assign</CyberButton>}
          </div>
        </div>
      </CyberModal>
    </div>
  );
};

export default Workbooks;