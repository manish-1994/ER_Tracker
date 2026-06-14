import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWorkbooks, createWorkbook, updateWorkbook, deleteWorkbook, verifyWorkbookDeleted } from "../services/workbookService";
import { createWorksheet, getWorksheets } from "../services/worksheetService";
import { createRow, createRowsBulk } from "../services/rowService";
import { supabase } from "../services/supabaseClient";
import { PageHeader } from "../components/ui/PageHeader";
import { CyberTable, CyberColumn } from "../components/ui/CyberTable";
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

  const fetchWorkbooks = async () => {
    const data = await getWorkbooks();
    return data;
  };

  const { data, isLoading, error, refetch } = useQuery({ 
    queryKey: ["workbooks"], 
    queryFn: fetchWorkbooks 
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setImportError("Unsupported format. Please upload .xlsx, .xls, or .csv files.");
      return;
    }
    
    setImportError("");
    setImportResult("");
    
    const startTime = Date.now();
    const updateProgress = (progress: number, step: string, details?: Partial<typeof importState>) => {
      setImportState(prev => ({ ...prev, progress, step, elapsed: Math.floor((Date.now() - startTime) / 1000), ...details }));
    };
    
    setImportState({
      isOpen: true,
      progress: 5,
      step: "Analyzing Workbook",
      currentSheet: "",
      currentRow: 0,
      totalRows: 0,
      sheetsProcessed: 0,
      totalSheets: 0,
      elapsed: 0,
    });
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      
      if (!workbook.SheetNames.length) {
        setImportError("Empty workbook file.");
        setImportState(prev => ({ ...prev, isOpen: false }));
        return;
      }
      
      updateProgress(15, "Detecting Sheets", { totalSheets: workbook.SheetNames.length, sheetsProcessed: 0 });
      
      updateProgress(25, "Creating Workbook Record");
      const wbRecord = await createWorkbook(file.name);
      
      let totalSheets = 0;
      let totalColumns = 0;
      let totalRows = 0;
      let processedSheets = 0;

      const getColLetter = (n: number): string => {
        let letter = "";
        while (n >= 0) {
          letter = String.fromCharCode((n % 26) + 65) + letter;
          n = Math.floor(n / 26) - 1;
        }
        return letter;
      };

      const getHeaderName = (colVal: any, idx: number, allEmpty: boolean): string => {
        if (allEmpty) {
          return `Column ${getColLetter(idx)}`;
        }
        const valStr = String(colVal || '').trim();
        if (!valStr) {
          return `Unnamed: ${idx + 1}`;
        }
        return valStr;
      };
      
      const sheetCount = workbook.SheetNames.length;
      
      for (let i = 0; i < workbook.SheetNames.length; i++) {
        const sheetName = workbook.SheetNames[i];
        const ws = workbook.Sheets[sheetName];
        const jsonRows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (jsonRows.length === 0) continue;
        
        totalSheets++;
        processedSheets++;
        updateProgress(
          25 + Math.round((processedSheets / sheetCount) * 20),
          "Importing Sheets",
          { sheetsProcessed: processedSheets, currentSheet: sheetName }
        );
        
        const wsRecord = await createWorksheet(wbRecord.id, sheetName);
        
        const headerRow = (jsonRows[0] as any[]) || [];
        const allEmpty = headerRow.length === 0 || headerRow.every(val => val === null || val === undefined || String(val).trim() === "");
        const processedHeaders = headerRow.map((col, idx) => getHeaderName(col, idx, allEmpty));
        
        const columnPromises = processedHeaders.map((colName, idx) => {
          totalColumns++;
          return supabase.from("columns").insert({
            sheet_id: wsRecord.id,
            name: colName,
            inferred_type: "text",
            is_hidden: false,
            display_order: idx,
          });
        });
        await Promise.all(columnPromises);
        
        const dataRowCount = jsonRows.length - 1;
        const rowBatch: any[] = [];
        
        for (let r = 1; r < jsonRows.length; r++) {
          const rowVals = jsonRows[r] as any[] || [];
          const rowData: Record<string, any> = {};
          processedHeaders.forEach((col, idx) => {
            const sanitizedKey = col.replace(/[^0-9a-zA-Z_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
            rowData[sanitizedKey] = rowVals[idx] !== undefined && rowVals[idx] !== null ? rowVals[idx] : "";
          });
          totalRows++;
          rowBatch.push(rowData);
        }
        
        const sheetProgress = 45 + Math.round((totalRows / (sheetCount * 100)) * 20);
        updateProgress(
          Math.min(sheetProgress, 70),
          "Importing Rows",
          { 
            currentSheet: sheetName,
            currentRow: 0,
            totalRows: dataRowCount,
            sheetsProcessed: processedSheets,
            totalSheets: sheetCount
          }
        );
        
        if (rowBatch.length > 0) {
          await createRowsBulk(wsRecord.id, rowBatch);
        }
      }
      
      updateProgress(95, "Finalizing");
      
      const totalImportMs = Date.now() - startTime;
      const statusText = `Import Successful! ${totalSheets} sheet(s), ${totalColumns} col(s), ${totalRows} rows. Total: ${(totalImportMs/1000).toFixed(1)}s`;
      setImportResult(statusText);
      toast.success(`Workbook ingested: ${file.name}`);
      refetch();
      
      updateProgress(100, "Complete", { 
        currentSheet: "", 
        currentRow: 0, 
        totalRows: 0 
      });
      
      setTimeout(() => {
        setImportState(prev => ({ ...prev, isOpen: false }));
      }, 3000);
    } catch (err: any) {
      const errMsg = err.message || "Failed to ingest workbook data node.";
      setImportError(errMsg);
      toast.error(`Ingestion failure: ${errMsg}`);
      setImportState(prev => ({ ...prev, isOpen: false }));
    }
  };

  const handleArchiveWorkbook = async (id: string) => {
    if (!window.confirm("Archive this workbook configuration?")) return;
    try {
      const { error } = await supabase.from("workbooks").delete().eq("id", id);
      if (error) throw error;
      toast.success("Workbook archived successfully");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to archive workbook");
    }
  };
  
  const handleInspectWorkbook = async (workbookId: string) => {
    setSelectedWbIdForSelector(workbookId);
    setSelectorOpen(true);
  };
  
  const openRenameModal = (workbookId: string, currentName: string) => {
    setRenameWorkbookId(workbookId);
    setRenameWorkbookName(currentName);
    setRenameOpen(true);
  };
  
  const closeRenameModal = () => {
    setRenameWorkbookId(null);
    setRenameWorkbookName("");
    setRenameOpen(false);
  };
  
  const saveWorkbookRename = async () => {
    if (!renameWorkbookId) return;
    const newName = renameWorkbookName.trim();
    if (!newName) {
      toast.warning("Workbook name cannot be empty.");
      return;
    }
    try {
      await updateWorkbook(renameWorkbookId, { name: newName });
      toast.success("Workbook renamed successfully");
      refetch();
      closeRenameModal();
    } catch (err: any) {
      toast.error(err.message || "Failed to rename workbook");
    }
  };
  
  const openAssignModal = async (workbookId: string, workbookName: string) => {
    setAssignWbId(workbookId);
    setAssignWbName(workbookName);
    setSelectedUser(null);
    setAssignCanEdit(true);
    setAssignCanDelete(false);
    setAssignCanExport(true);
    setAssignNotesEnabled(true);
    setAssignEntireWorkbook(true);
    setUsersError(null);
    setAssignSuccess(null);
    
    setUsersLoading(true);
    try {
      const loadedUsers = await getAssignableUsers();
      setUsers(loadedUsers);
      localStorage.setItem("workspace_users_cache", JSON.stringify(loadedUsers));
    } catch (err: any) {
      setUsersError(err.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
    setAssignOpen(true);
  };
  
  const closeAssignModal = () => {
    setAssignWbId(null);
    setAssignWbName("");
    setSelectedUser(null);
    setUsers([]);
    setAssignOpen(false);
  };
  
  const saveAssignWorkbook = async () => {
    if (!assignWbId) {
      toast.warning("Workbook required for assignment.");
      return;
    }
    
    if (!selectedUser) {
      toast.warning("Select a user for assignment.");
      return;
    }
    
    try {
      const result = await assignWorkbook(
        selectedUser.id, 
        assignWbId, 
        appUser?.id?.toString() || "superadmin", 
        {
          can_edit: assignCanEdit,
          can_delete: assignCanDelete,
          can_export: assignCanExport,
          notes_enabled: assignNotesEnabled,
          sheet_ids: assignEntireWorkbook ? undefined : []
        }
      );
      
      setAssignSuccess(selectedUser);
    } catch (err: any) {
      toast.error(`Assignment failed: ${err.message}`);
    }
  };
  
  const openDeleteModal = (workbookId: string, workbookName: string) => {
    setDeleteWorkbookId(workbookId);
    setDeleteWorkbookName(workbookName);
    setDeleteOpen(true);
  };
  
  const closeDeleteModal = () => {
    setDeleteWorkbookId(null);
    setDeleteWorkbookName("");
    setDeleteOpen(false);
  };
  
  const handleDeleteWorkbook = async () => {
    if (!deleteWorkbookId) return;
    
    try {
      await deleteWorkbook(deleteWorkbookId, deleteWorkbookName, appUser?.id?.toString());
      
      const isDeleted = await verifyWorkbookDeleted(deleteWorkbookId);
      if (!isDeleted) {
        throw new Error("Workbook deletion verification failed");
      }
      
      toast.success("WORKBOOK PURGED SUCCESSFULLY");
      refetch();
      closeDeleteModal();
    } catch (err: any) {
      toast.error(`WORKBOOK PURGE FAILED\nReason: ${err.message || "Unknown database error"}`);
    }
  };

  const columns: CyberColumn[] = [
    {
      header: "Workbook Name",
      accessor: "name",
      render: (row) => (
        <span className="font-bold text-primary flex items-center">
          <span className="mr-2 text-cyan-500/50">📊</span> {row.name}
        </span>
      ),
    },
    {
      header: "Ingestion Date",
      accessor: "uploaded_at",
      render: (row) => (
        <span className="text-muted text-xs">
          {row.uploaded_at ? new Date(row.uploaded_at).toLocaleString() : "-"}
        </span>
      ),
    },
  ];

  const filteredData = (data || []).filter((wb: any) =>
    wb.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-mono font-black tracking-wider text-primary uppercase neon-text-primary">
          Workbook Archives
        </h1>
        <p className="text-muted font-mono text-sm">
          Tabular data nodes ingestion & configuration dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <CyberCard variant="primary" className="space-y-4">
            <h2 className="text-md font-mono font-bold tracking-widest text-primary uppercase border-b border-cyan-500/25 pb-2">
              Data Ingestion Panel
            </h2>
            <p className="text-xs text-muted leading-relaxed font-mono">
              Select an `.xlsx`, `.xls`, or `.csv` spreadsheet file to parse and map raw entries into active database segments.
            </p>

            <div className="border border-dashed border-cyan-500/30 bg-[#0a0f1d]/50 hover:bg-primary/5 rounded-lg p-6 transition-all duration-300 text-center relative cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={importState.isOpen}
              />
              <div className="space-y-2">
                <span className="text-3xl text-primary/50 block">⚡</span>
                <span className="text-xs font-mono font-bold text-primary uppercase tracking-wider block">
                  Select Spreadsheet
                </span>
                <span className="text-[10px] text-gray-500 font-mono block">
                  XLSX / XLS / CSV formats supported
                </span>
              </div>
            </div>

            {importState.isOpen && (
              <CyberProgressModal
                isOpen={importState.isOpen}
                progress={importState.progress}
                step={importState.step}
                currentSheet={importState.currentSheet}
                currentRow={importState.currentRow}
                totalRows={importState.totalRows}
                sheetsProcessed={importState.sheetsProcessed}
                totalSheets={importState.totalSheets}
                elapsedTime={importState.elapsed}
              />
            )}

            {importResult && (
              <div className="p-3 bg-success/10 border border-success/40 rounded-lg">
                <div className="text-xs font-mono text-success font-bold uppercase mb-1">Success</div>
                <div className="text-[10px] font-mono text-success/90">{importResult}</div>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-danger/10 border border-danger/40 rounded-lg">
                <div className="text-xs font-mono text-danger font-bold uppercase mb-1">Error</div>
                <div className="text-[10px] font-mono text-danger/90">{importError}</div>
              </div>
            )}
          </CyberCard>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <CyberCard className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/15 pb-2">
              <h2 className="text-md font-mono font-bold tracking-widest text-primary uppercase">
                Archive Registry
              </h2>
              <div className="w-full sm:w-60">
                <CyberInput
                  type="text"
                  placeholder="Filter archives..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="p-10 text-center font-mono text-muted animate-pulse">
                Querying workbook data nodes...
              </div>
            ) : error ? (
              <div className="p-10 text-center font-mono text-danger">
                Failed to load archives from system storage.
              </div>
            ) : (
              <CyberTable
                columns={columns}
                data={filteredData}
                actions={(row) => (
                  <div className="flex items-center gap-2">
                    <CyberButton
                      size="sm"
                      variant="secondary"
                      onClick={() => openRenameModal(row.id, row.name)}
                      title="Rename workbook"
                    >
                      ✎
                    </CyberButton>
                    <CyberButton
                      size="sm"
                      variant="primary"
                      onClick={() => handleInspectWorkbook(row.id)}
                    >
                      Inspect
                    </CyberButton>
                    <CyberButton
                      size="sm"
                      variant="secondary"
                      onClick={() => openAssignModal(row.id, row.name)}
                      title="Assign workbook to user"
                    >
                      Assign
                    </CyberButton>
                    <CyberButton
                      size="sm"
                      variant="danger"
                      onClick={() => openDeleteModal(row.id, row.name)}
                    >
                      Delete
                    </CyberButton>
                  </div>
                )}
              />
            )}
          </CyberCard>
        </div>
      </div>

      <CyberModal isOpen={isRenameOpen} onClose={closeRenameModal} title="Rename Workbook">
        <div className="space-y-4 font-mono text-xs">
          <p className="text-slate-400 mb-2 leading-relaxed">
            Enter a new name for this workbook configuration.
          </p>
          <CyberInput
            type="text"
            placeholder="New workbook name"
            value={renameWorkbookName}
            onChange={(e) => setRenameWorkbookName(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-cyan-500/10">
            <CyberButton type="button" onClick={closeRenameModal} variant="secondary">
              Cancel
            </CyberButton>
            <CyberButton type="button" onClick={saveWorkbookRename} variant="primary">
              Save
            </CyberButton>
          </div>
        </div>
      </CyberModal>

      <CyberModal isOpen={isDeleteOpen} onClose={closeDeleteModal} title="DELETE WORKBOOK">
        <div className="space-y-4 font-mono text-xs">
          <p className="text-slate-400 mb-2 leading-relaxed">
            This action cannot be undone.
          </p>
          <div className="text-[10px] text-slate-300 space-y-1">
            <p>The following will be removed:</p>
            <ul className="list-disc list-inside pl-2 space-y-0.5 text-danger">
              <li>Workbook</li>
              <li>Sheets</li>
              <li>Columns</li>
              <li>Imported Records</li>
              <li>Dashboard Links</li>
              <li>Workbook Permissions</li>
            </ul>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-cyan-500/10">
            <CyberButton type="button" onClick={closeDeleteModal} variant="secondary">
              CANCEL
            </CyberButton>
            <CyberButton type="button" onClick={handleDeleteWorkbook} variant="danger">
              DELETE WORKBOOK
            </CyberButton>
          </div>
        </div>
      </CyberModal>

      <SheetSelector
        isOpen={isSelectorOpen}
        onClose={() => setSelectorOpen(false)}
        workbookId={selectedWbIdForSelector}
        onSelect={(sheetId) => {
          setSelectorOpen(false);
          navigate(`/worksheets/${sheetId}`);
        }}
      />
      
      <CyberModal isOpen={isAssignOpen} onClose={closeAssignModal} title="ASSIGN WORKBOOK">
        <div className="space-y-4 font-mono text-xs">
          <p className="text-slate-400 mb-2">Assign workbook to a user with specific permissions.</p>
          
          {assignSuccess ? (
            <div className="p-4 bg-success/10 border border-success/40 rounded-lg">
              <div className="text-xs font-bold text-success uppercase mb-2">Workbook Assigned Successfully</div>
              <div className="text-[10px] text-slate-300 space-y-1">
                <p><span className="text-success">Assigned User:</span> {assignSuccess.username || assignSuccess.email}</p>
                <p><span className="text-success">Workbook:</span> {assignWbName}</p>
                <p><span className="text-success">Permissions:</span> Edit: {assignCanEdit ? "Yes" : "No"}, Delete: {assignCanDelete ? "Yes" : "No"}, Export: {assignCanExport ? "Yes" : "No"}, Notes: {assignNotesEnabled ? "Yes" : "No"}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] text-primary/80 uppercase mb-1">User</label>
                {usersLoading ? (
                  <div className="p-3 text-center text-muted animate-pulse">Loading users...</div>
                ) : usersError ? (
                  <div className="p-3 text-danger text-[10px]">{usersError}</div>
                ) : users.length === 0 ? (
                  <div className="p-3 text-slate-400 text-[10px]">No users found. Create users in the User Management page first.</div>
                ) : (
                  <CyberSelect
                    placeholder="Select a user..."
                    value={selectedUser?.id || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const user = users.find(u => u.id === val) || null;
                      setSelectedUser(user);
                    }}
                    options={users.map(u => ({
                      value: u.id,
                      label: `${u.username || u.email}`,
                      subtext: `${u.role || "viewer"}`
                    }))}
                  />
                )}
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-[10px] text-slate-300">
                  <input type="checkbox" checked={assignEntireWorkbook} onChange={(e) => setAssignEntireWorkbook(e.target.checked)} className="accent-primary" />
                  Assign Entire Workbook
                </label>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2 text-[10px] text-slate-300">
                  <input type="checkbox" checked={assignCanEdit} onChange={(e) => setAssignCanEdit(e.target.checked)} className="accent-primary" />
                  Can Edit
                </label>
                <label className="flex items-center gap-2 text-[10px] text-slate-300">
                  <input type="checkbox" checked={assignCanDelete} onChange={(e) => setAssignCanDelete(e.target.checked)} className="accent-primary" />
                  Can Delete
                </label>
                <label className="flex items-center gap-2 text-[10px] text-slate-300">
                  <input type="checkbox" checked={assignCanExport} onChange={(e) => setAssignCanExport(e.target.checked)} className="accent-primary" />
                  Can Export
                </label>
                <label className="flex items-center gap-2 text-[10px] text-slate-300">
                  <input type="checkbox" checked={assignNotesEnabled} onChange={(e) => setAssignNotesEnabled(e.target.checked)} className="accent-primary" />
                  Notes Enabled
                </label>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t border-cyan-500/10">
            <CyberButton type="button" onClick={closeAssignModal} variant="secondary">
              {assignSuccess ? "Close" : "Cancel"}
            </CyberButton>
            {!assignSuccess && (
              <CyberButton type="button" onClick={saveAssignWorkbook} variant="primary" disabled={!selectedUser}>
                Assign Workbook
              </CyberButton>
            )}
          </div>
        </div>
      </CyberModal>
    </div>
  );
};

export default Workbooks;