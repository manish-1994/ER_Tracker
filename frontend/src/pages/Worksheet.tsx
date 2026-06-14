import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { supabase } from "../services/supabaseClient";
import { getUserRole } from "../services/roleService";
import { getRows, createRow, deleteRow, updateRow, resolveRecordTable, Row } from "../services/rowService";
import { 
  updateWorksheet, 
  updateColumnDisplayName, 
  hideColumn, 
  reorderColumns, 
  getColumns, 
  getCleanSheetName,
  createColumn,
  deleteColumn,
  parseColumnType,
  formatColumnType,
  ParsedColumnType
} from "../services/worksheetService";
import { getAuditLogs, getRecordAuditLogs, logAudit } from "../services/auditService";
import { getWorksheetPermissions, RecordNote, getRecordNotes, createRecordNote, updateRecordNote, deleteRecordNote, getAssignableUsers } from "../services/workspaceService";
import { PageHeader } from "../components/ui/PageHeader";
import { CyberTable, CyberColumn } from "../components/ui/CyberTable";
import { CyberDrawer } from "../components/ui/CyberDrawer";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberButton } from "../components/ui/CyberButton";
import { CyberModal } from "../components/ui/CyberModal";
import { CyberInput } from "../components/ui/CyberInput";
import { CyberBadge } from "../components/ui/CyberBadge";
import { motion, AnimatePresence } from "framer-motion";
import { exportToExcel, exportToCSV, exportToPDF } from "../utils/exportUtils";

const Worksheet: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { appUser } = useAuth();
  const toast = useToast();

  // ----- RBAC -----
  const [role, setRole] = useState<string>('Viewer'); // default fallback
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [wsCanDelete, setWsCanDelete] = useState(false);
  const [wsCanEdit, setWsCanEdit] = useState(false);

  // States
  const [localRows, setLocalRows] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [lastDeletedRows, setLastDeletedRows] = useState<any[] | null>(null);
  const [showUndo, setShowUndo] = useState<boolean>(false);
  const [undoCountdown, setUndoCountdown] = useState<number>(0);
  const [editingCell, setEditingCell] = useState<{ rowId: string; accessor: string } | null>(null);
  const [editingHeader, setEditingHeader] = useState<string | null>(null);
  const [headerInput, setHeaderInput] = useState<string>("");
  const [isAddOpen, setAddOpen] = useState(false);

  // Column management states
  const [isAddColOpen, setAddColOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColType, setNewColType] = useState("Text");
  const [newColRequired, setNewColRequired] = useState(false);
  const [newColDefault, setNewColDefault] = useState("");
  const [newColOptions, setNewColOptions] = useState("");
  const [isManageColsOpen, setManageColsOpen] = useState(false);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingColName, setEditingColName] = useState("");
  const [isAuditOpen, setAuditOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isRenameWsOpen, setRenameWsOpen] = useState(false);
  const [renameWsTitle, setRenameWsTitle] = useState<string>("");
  const [rowSearch, setRowSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [smartView, setSmartView] = useState<string>("All");
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);
  const [detailEditValues, setDetailEditValues] = useState<Record<string, string>>({});
  const [publicNotes, setPublicNotes] = useState<RecordNote[]>([]);
  const [privateNotes, setPrivateNotes] = useState<RecordNote[]>([]);
  const [recordAuditLogs, setRecordAuditLogs] = useState<any[]>([]);
  const [newPublicNoteContent, setNewPublicNoteContent] = useState("");
  const [newPrivateNoteContent, setNewPrivateNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [isDeleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetRowId, setDeleteTargetRowId] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !appUser?.id) {
      setRole('Viewer');
      setIsSuperAdmin(false);
      return;
    }
    
// Check if user is SuperAdmin first
    const checkSuperAdmin = async () => {
      try {
        const { data: userRoles } = await supabase
          .from("user_roles")
          .select("role_id")
          .eq("user_id", appUser.id);
        if (userRoles && userRoles.length > 0) {
          const { data: roles } = await supabase
            .from("roles")
            .select("name")
            .in("id", userRoles.map((ur: any) => ur.role_id));
          setIsSuperAdmin((roles || []).some((r: any) => r.name === "SuperAdmin"));
        }
      } catch {
        // ignore
      }
    };

         checkSuperAdmin();
    getUserRole(id, String(appUser.id))
      .then((roleData) => setRole(roleData.role || 'Viewer'))
      .catch(() => setRole('Viewer'));
  }, [id, appUser?.id]);

  // Can view records if: SuperAdmin OR role is not Viewer
  const canView = isSuperAdmin || role !== 'Viewer';
  const canEdit = isSuperAdmin || canView;
  const canAdd = canEdit;
  const canDelete = isSuperAdmin || wsCanDelete;
  const canManageColumns = isSuperAdmin || role === 'Admin' || wsCanEdit;

// ----- React Query for Column Metadata -----
  const fetchCols = async () => {
    if (!id) return [];
    try {
      return await getColumns(id);
    } catch {
      throw new Error("Failed to fetch columns");
    }
  };

  const {
    data: colsData,
    isLoading: isColsLoading,
    isError: isColsError,
    error: colsError,
    refetch: refetchCols
  } = useQuery({ queryKey: ["worksheet-columns", id], queryFn: fetchCols });

  // ----- React Query for Row Data -----
  const fetchRows = async () => {
    if (!id) return [];
    return await getRows(id);
  };

  const {
    data: rows,
    isLoading: isRowsLoading,
    isError: isRowsError,
    error: rowsError,
    refetch: refetchRows,
  } = useQuery({ 
    queryKey: ["worksheet-rows", id], 
    queryFn: fetchRows 
});

  const isLoading = isColsLoading || isRowsLoading;
  const isError = isColsError || isRowsError;

  // Load workspace users for username resolution in notes / timeline
  useEffect(() => {
    getAssignableUsers();
  }, []);

  // Realtime subscription for worksheet records
  useEffect(() => {
    if (!id) return;
    
    let subscription: any = null;
    let isActive = true;
    
    resolveRecordTable(id).then(tn => {
      if (!isActive) return;
      subscription = supabase
        .channel(`rows:${id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: tn
        }, () => {
          refetchRows();
        })
        .subscribe();
    });

    return () => {
      isActive = false;
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [id, refetchRows]);

  // Sync selected record with localRows when rows are updated via realtime
  useEffect(() => {
    if (selectedRecord && localRows.length > 0) {
      const updated = localRows.find(r => r.id === selectedRecord.id);
      if (updated) {
        if (JSON.stringify(updated.data) !== JSON.stringify(selectedRecord.data)) {
          setSelectedRecord(updated);
          // If the user isn't editing fields, update edit values too
          setDetailEditValues(prev => {
            const keys = Object.keys(updated.data);
            const hasDraftChanges = keys.some(k => prev[k] !== selectedRecord.data[k]);
            if (!hasDraftChanges) {
              return updated.data;
            }
            return prev;
          });
        }
      }
    }
  }, [localRows, selectedRecord]);

  // Realtime subscription for workspace notes
  useEffect(() => {
    if (!id || !selectedRecord?.id) return;

    const subscription = supabase
      .channel(`notes-collab:${id}:${selectedRecord.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'workspace_notes'
      }, (payload: any) => {
        const newRecordId = payload.new?.record_id || payload.old?.record_id;
        const newSheetId = payload.new?.sheet_id || payload.old?.sheet_id;
        if (String(newRecordId) === String(selectedRecord.id) && String(newSheetId) === String(id)) {
          fetchRecordNotesAndTimeline(selectedRecord.id);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [id, selectedRecord?.id]);

  const refetchAll = () => {
    refetchCols();
    refetchRows();
  };

  // Header editing states

  const startHeaderEdit = (accessor: string, current: string) => {
    if (!canEdit) {
      toast.error("Insufficient clearance level to edit columns.");
      return;
    }
    setEditingHeader(accessor);
    setHeaderInput(current);
  };

  const cancelHeaderEdit = () => {
    setEditingHeader(null);
    setHeaderInput("");
  };

  const saveHeader = async (accessor: string) => {
    const newName = headerInput.trim();
    if (!id) return;
    if (!newName) {
      toast.warning("Display header title cannot be empty.");
      return;
    }
    // Check duplicates
    const isDuplicate = (colsData || []).some((col: any) => col.display_name === newName && col.name !== accessor);
    if (isDuplicate) {
      toast.warning(`Tier column headers must be unique: [${newName}] already exists.`);
      return;
    }

    try {
      await updateColumnDisplayName(id, accessor, newName);
      toast.success(`Header updated successfully: ${newName}`);
      refetchCols();
    } catch {
      toast.error("Failed to commit column header update.");
    } finally {
      cancelHeaderEdit();
    }
  };

  // Column hide/reorder handlers
  const toggleColumnHidden = async (accessor: string, currentlyHidden: boolean) => {
    if (!id) return;
    try {
      await hideColumn(id, accessor, !currentlyHidden);
      toast.success(`Column ${!currentlyHidden ? "hidden" : "shown"} successfully`);
      refetchCols();
    } catch (e: any) {
      toast.error("Failed to update column visibility");
    }
  };

const moveColumnLeft = async (accessor: string, currentIndex: number) => {
    if (!id || currentIndex === 0) return;
    try {
      const visibleCols = (colsData || []).filter((col: any) => !col.hidden);
      const reordered = [...visibleCols];
      const [moved] = reordered.splice(currentIndex, 1);
      reordered.splice(currentIndex - 1, 0, moved);
      
      const columnOrders = reordered.map((col, idx) => ({
        accessor: col.name,
        order: idx
      }));
      await reorderColumns(id, columnOrders);
      toast.success("Column reordered");
      refetchCols();
    } catch (e: any) {
      toast.error("Failed to reorder column");
    }
  };

const moveColumnRight = async (accessor: string, currentIndex: number, total: number) => {
    if (!id || currentIndex === total - 1) return;
    try {
      const visibleCols = (colsData || []).filter((col: any) => !col.hidden);
      const reordered = [...visibleCols];
      const [moved] = reordered.splice(currentIndex, 1);
      reordered.splice(currentIndex + 1, 0, moved);
      
      const columnOrders = reordered.map((col, idx) => ({
        accessor: col.name,
        order: idx
      }));
      await reorderColumns(id, columnOrders);
      toast.success("Column reordered");
      refetchCols();
    } catch (e: any) {
      toast.error("Failed to reorder column");
    }
  };

  // Sync fetched rows to local state
  useEffect(() => {
    if (rows) setLocalRows(rows);
  }, [rows]);

  // Undo countdown timer effect
  useEffect(() => {
    if (!showUndo || undoCountdown <= 0) {
      if (undoCountdown === 0 && showUndo) {
        setShowUndo(false);
        setLastDeletedRows(null);
      }
      return;
    }
    const timer = setTimeout(() => {
      setUndoCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [showUndo, undoCountdown]);

  // Cell editing states

  const startEdit = (rowId: string, accessor: string) => {
    if (!canEdit) {
      toast.error("Insufficient clearance level to modify cells.");
      return;
    }
    setEditingCell({ rowId, accessor });
  };

  const cancelEdit = () => setEditingCell(null);

  const commitEdit = async (rowId: string, accessor: string, value: string) => {
    if (!value) {
      toast.warning("Cell entry value cannot be blank.");
      return;
    }
    if (!id) return;
    try {
      const currentRow = localRows.find((r) => r.id === rowId);
      const currentData = currentRow?.data || {};
      
      // Prevent write if value didn't change
      if (currentData[accessor] === value) {
        setEditingCell(null);
        return;
      }
      
      // Merge current cell payload to prevent data loss in dynamic entries
      const updatedData = { ...currentData, [accessor]: value };
      
      await updateRow(id, rowId, updatedData);
      
      // Update local state directly
      setLocalRows((prev) =>
        prev.map((r) => (r.id === rowId ? { ...r, data: updatedData } : r))
      );
      toast.success("Cell value updated successfully");

      // Log async audit entry
      logAudit({
        user_id: appUser?.id?.toString() || "anonymous",
        worksheet_id: id || "",
        action: "cell_updated",
        record_id: rowId,
        old_value: currentData[accessor] || "",
        new_value: value,
      });
    } catch {
      toast.error("Failed to commit inline cell update.");
    } finally {
      setEditingCell(null);
    }
  };

  // Worksheet permissions state

  // Fetch worksheet permissions
  useEffect(() => {
    if (!id || !appUser?.id) {
      setWsCanDelete(false);
      setWsCanEdit(false);
      return;
    }
    const fetchPermissions = async () => {
      try {
        // Get workbook_id from sheets table first
        const { data: sheet } = await supabase.from("sheets").select("workbook_id").eq("id", parseInt(id)).single();
        if (sheet?.workbook_id) {
          const perms = await getWorksheetPermissions(String(appUser.id), String(sheet.workbook_id));
          setWsCanDelete(perms.can_delete);
          setWsCanEdit(perms.can_edit);
        }
      } catch {
        setWsCanDelete(false);
        setWsCanEdit(false);
      }
    };
    fetchPermissions();
  }, [id, appUser?.id]);

  // Fetch worksheet title
  const fetchWorksheet = async () => {
    if (!id) return null;
    const { data, error } = await supabase
      .from("sheets")
      .select("name")
      .eq("id", id)
      .single();
    if (error) throw error;
    return { title: data?.name };
  };
  
  const { data: wsData } = useQuery({
    queryKey: ["worksheet", id],
    queryFn: fetchWorksheet,
    enabled: !!id,
  });

  // Sync browser document title to human-readable sheet name
  useEffect(() => {
    if (id) {
      const cleanName = getCleanSheetName(id, wsData?.title || "");
      document.title = `${cleanName} | ER Tracker`;
    }
  }, [id, wsData?.title]);
  
  const openRenameWsModal = () => {
    if (!canEdit) {
      toast.error("Insufficient permissions to rename worksheet.");
      return;
    }
    setRenameWsTitle(wsData?.title || "");
    setRenameWsOpen(true);
  };
  
  const closeRenameWsModal = () => {
    setRenameWsTitle("");
    setRenameWsOpen(false);
  };
  
  const saveWsRename = async () => {
    if (!id) return;
    const newName = renameWsTitle.trim();
    if (!newName) {
      toast.warning("Worksheet title cannot be empty.");
      return;
    }
    try {
      await updateWorksheet(id, { title: newName });
      toast.success("Worksheet renamed successfully");
      refetchAll();
      closeRenameWsModal();
} catch {
      toast.error("Failed to rename worksheet");
    }
  };

  const getHybridRows = (worksheetId: string): Record<string, Record<string, any>> => {
    try {
      const raw = localStorage.getItem(`hybrid_rows_${worksheetId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveHybridRows = (worksheetId: string, rows: Record<string, Record<string, any>>) => {
    try {
      localStorage.setItem(`hybrid_rows_${worksheetId}`, JSON.stringify(rows));
    } catch {
      // ignore
    }
  };

  const openAddModal = () => {
    if (!canAdd) {
      toast.error("Insufficient permissions to add rows.");
      return;
    }
    const defaults: Record<string, string> = {};
    (colsData || []).forEach((col: any) => {
      const typeInfo = parseColumnType(col.data_type);
      if (typeInfo.defaultValue) {
        defaults[col.name] = typeInfo.defaultValue;
      }
    });
    setFormValues(defaults);
    setAddOpen(true);
  };

  // Add Column Modal Handlers
  const openAddColModal = () => {
    if (!canManageColumns) {
      toast.error("Insufficient permissions to manage columns.");
      return;
    }
    setNewColName("");
    setNewColType("Text");
    setNewColRequired(false);
    setNewColDefault("");
    setNewColOptions("");
    setAddColOpen(true);
  };

  const closeAddColModal = () => setAddColOpen(false);

  const handleAddColumn = async () => {
    const colName = newColName.trim();
    if (!colName) {
      toast.warning("Column name cannot be blank.");
      return;
    }
    if (!id) return;
    
    try {
      const typeInfo: ParsedColumnType = {
        baseType: newColType,
        options: newColOptions.split(",").map(o => o.trim()).filter(Boolean),
        required: newColRequired,
        defaultValue: newColDefault.trim()
      };
      const inferredType = formatColumnType(typeInfo);
      
      const nextOrder = (colsData || []).length;
      
      await createColumn(id, colName, inferredType, nextOrder);
      
      toast.success("New column created successfully.");
      refetchCols();
      refetchRows();
      closeAddColModal();
      
      // Log audit
      logAudit({
        user_id: appUser?.id?.toString() || "anonymous",
        worksheet_id: id,
        action: "column_created",
        new_value: `${colName} (${newColType})`,
      });
    } catch {
      toast.error("Failed to create column.");
    }
  };

  // Manage Columns Modal Handlers
  const openManageColsModal = () => {
    if (!canManageColumns) {
      toast.error("Insufficient permissions to manage columns.");
      return;
    }
    setEditingColId(null);
    setEditingColName("");
    setManageColsOpen(true);
  };

  const closeManageColsModal = () => setManageColsOpen(false);

  const handleRenameCol = async (accessor: string, newDisplayName: string) => {
    if (!newDisplayName.trim()) return;
    if (!id) return;
    try {
      await updateColumnDisplayName(id, accessor, newDisplayName);
      toast.success("Column renamed successfully.");
      refetchCols();
      setEditingColId(null);
      
      logAudit({
        user_id: appUser?.id?.toString() || "anonymous",
        worksheet_id: id,
        action: "column_renamed",
        old_value: accessor,
        new_value: newDisplayName,
      });
} catch {
      toast.error("Failed to rename column");
    }
  };

  const handleToggleHideCol = async (accessor: string, currentlyHidden: boolean) => {
    if (!id) return;
    try {
      await hideColumn(id, accessor, !currentlyHidden);
      toast.success(currentlyHidden ? "Column shown successfully." : "Column hidden successfully.");
      refetchCols();
    } catch (err: any) {
      toast.error("Failed to update column visibility.");
    }
  };

  const handleMoveCol = async (accessor: string, direction: "up" | "down", currentIndex: number) => {
    if (!id || !colsData) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= colsData.length) return;
    
    try {
      const orders = colsData.map((col: any, idx: number) => {
        if (idx === currentIndex) {
          return { accessor: col.name, order: targetIndex };
        } else if (idx === targetIndex) {
          return { accessor: col.name, order: currentIndex };
        }
        return { accessor: col.name, order: col.order };
      });
      
      await reorderColumns(id, orders);
      toast.success("Columns reordered.");
      refetchCols();
    } catch (err: any) {
      toast.error("Failed to reorder columns.");
    }
  };

  const handleDeleteCol = async (accessor: string, displayName: string) => {
    if (!window.confirm(`Are you sure you want to delete column: [${displayName}]?\nAll cell values for this column will be lost!`)) return;
    if (!id) return;
    
    try {
      await deleteColumn(id, accessor);
      toast.success("Column deleted successfully.");
      
      // Clean up dynamic values in local hybrid storage for all rows if any
      const hybridRows = getHybridRows(id);
      Object.keys(hybridRows).forEach(rowId => {
        if (hybridRows[rowId]) {
          delete hybridRows[rowId][accessor];
        }
      });
      saveHybridRows(id, hybridRows);
      
      refetchCols();
      refetchRows();
      
      logAudit({
        user_id: appUser?.id?.toString() || "anonymous",
        worksheet_id: id,
        action: "column_deleted",
        old_value: displayName,
      });
    } catch (err: any) {
      toast.error("Failed to delete column.");
    }
  };

  const openAuditModal = async () => {
    if (!id) return;
    try {
      const data = await getAuditLogs(id);
      setAuditLogs(data || []);
      setAuditOpen(true);
    } catch {
      toast.error("Failed to fetch audit log logs.");
    }
  };

  const closeAddModal = () => {
    setAddOpen(false);
    setFormValues({});
  };

  const closeAuditModal = () => setAuditOpen(false);
  
  const getUserDisplayName = (userId: string) => {
    if (String(userId) === String(appUser?.id)) return "You";
    try {
      const cached = localStorage.getItem("workspace_users_cache");
      if (cached) {
        const users = JSON.parse(cached);
        const found = users.find((u: any) => String(u.id) === String(userId));
        if (found?.username) return found.username;
      }
    } catch {}
    return `User #${userId}`;
  };

  const fetchRecordNotesAndTimeline = async (recordId: string) => {
    if (!id || !appUser?.id) return;
    try {
      const [pub, priv, recordLogs] = await Promise.all([
        getRecordNotes(id, recordId, false),
        getRecordNotes(id, recordId, true, String(appUser.id)),
        getRecordAuditLogs(id, recordId)
      ]);
      setPublicNotes(pub);
      setPrivateNotes(priv);
      setRecordAuditLogs(recordLogs);
    } catch {
      // ignore
    }
  };

  // Record detail panel handlers
  const openRecordDetail = (row: any) => {
    setSelectedRecord(row);
    setDetailEditValues(row.data || {});
    setDetailOpen(true);
    fetchRecordNotesAndTimeline(row.id);
  };
  
  const closeRecordDetail = () => {
    setDetailOpen(false);
    setSelectedRecord(null);
    setDetailEditValues({});
    setPublicNotes([]);
    setPrivateNotes([]);
    setRecordAuditLogs([]);
    setNewPublicNoteContent("");
    setNewPrivateNoteContent("");
    setEditingNoteId(null);
    setEditingNoteContent("");
  };

  // Add record note handler
  const handleAddNote = async (isPrivate: boolean) => {
    if (!id || !selectedRecord?.id || !appUser?.id) return;
    
    const content = isPrivate ? newPrivateNoteContent.trim() : newPublicNoteContent.trim();
    if (!content) return;

    try {
      const { data: sheet } = await supabase.from("sheets").select("workbook_id").eq("id", parseInt(id)).single();
      
      const note = await createRecordNote({
        user_id: String(appUser.id),
        workbook_id: sheet?.workbook_id ? String(sheet.workbook_id) : undefined,
        sheet_id: id,
        record_id: selectedRecord.id,
        is_private: isPrivate,
        content: content
      });

      if (note) {
        if (isPrivate) {
          setNewPrivateNoteContent("");
        } else {
          setNewPublicNoteContent("");
        }
        
        logAudit({
          user_id: appUser?.id?.toString() || "anonymous",
          worksheet_id: id,
          action: isPrivate ? "private_note_added" : "public_note_added",
          record_id: selectedRecord.id,
          new_value: content,
        });

        fetchRecordNotesAndTimeline(selectedRecord.id);
        toast.success(isPrivate ? "Private note added" : "Public note added");
      }
    } catch {
      toast.error("Failed to add note");
    }
  };

  // Edit record note handler
  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteContent.trim()) return;
    try {
      await updateRecordNote(noteId, editingNoteContent);
      setEditingNoteId(null);
      setEditingNoteContent("");
      
      if (selectedRecord?.id) {
        logAudit({
          user_id: appUser?.id?.toString() || "anonymous",
          worksheet_id: id!,
          action: "note_updated",
          record_id: selectedRecord.id,
          new_value: editingNoteContent,
        });
        fetchRecordNotesAndTimeline(selectedRecord.id);
      }
      toast.success("Note updated");
} catch {
      toast.error("Failed to commit column header update.");
    }
  };

  // Delete record note handler
  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    try {
      await deleteRecordNote(noteId);
      if (selectedRecord?.id) {
        logAudit({
          user_id: appUser?.id?.toString() || "anonymous",
          worksheet_id: id!,
          action: "note_deleted",
          record_id: selectedRecord.id,
        });
        fetchRecordNotesAndTimeline(selectedRecord.id);
      }
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const openDeleteConfirm = (rowId: string) => {
    setDeleteTargetRowId(rowId);
    setDeleteConfirmOpen(true);
    setDetailOpen(false);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setDeleteTargetRowId(null);
  };

  const confirmDelete = async () => {
    if (!id || !deleteTargetRowId) return;
    
    try {
      const oldRow = localRows.find(r => r.id === deleteTargetRowId);
      if (!oldRow) return;

      // Audit log before deletion
      logAudit({
        user_id: appUser?.id?.toString() || "anonymous",
        worksheet_id: id,
        action: "record_deleted",
        record_id: deleteTargetRowId,
        old_value: JSON.stringify(oldRow.data || {}),
      });
      
      await deleteRow(id, deleteTargetRowId);
      
      // Save to undo history
      setLastDeletedRows([oldRow]);
      setUndoCountdown(8);
      setShowUndo(true);

      // Remove from local state
      setLocalRows(prev => prev.filter(r => r.id !== deleteTargetRowId));
      
      toast.success("Record deleted successfully");
      refetchRows();
      closeDeleteConfirm();
    } catch {
      toast.error("Failed to delete record");
      closeDeleteConfirm();
    }
  };

  const handleDetailFieldChange = (accessor: string, value: string) => {
    setDetailEditValues(prev => ({ ...prev, [accessor]: value }));
  };

  const saveRecordDetail = async () => {
    if (!id || !selectedRecord) return;
    
    try {
      await updateRow(id, selectedRecord.id, detailEditValues);
      
      // Update local state
      setLocalRows(prev => prev.map(r => 
        r.id === selectedRecord.id ? { ...r, data: detailEditValues } : r
      ));
      
      // Audit log
      logAudit({
        user_id: appUser?.id?.toString() || "anonymous",
        worksheet_id: id,
        action: "record_updated",
        record_id: selectedRecord.id,
        old_value: JSON.stringify(selectedRecord.data || {}),
        new_value: JSON.stringify(detailEditValues),
      });
      
      toast.success("Record updated successfully");
      closeRecordDetail();
    } catch (e: any) {
      toast.error("Failed to update record");
    }
  };
  
  const handleQuickAction = async (action: string, value?: string) => {
    if (!id || !selectedRecord) return;
    
    const updatedData: Record<string, string> = { ...detailEditValues, [action]: value || "" };
    setDetailEditValues(updatedData);
    
    try {
      await updateRow(id, selectedRecord.id, updatedData);
      setLocalRows(prev => prev.map(r => 
        r.id === selectedRecord.id ? { ...r, data: updatedData } : r
      ));
      
      logAudit({
        user_id: appUser?.id?.toString() || "anonymous",
        worksheet_id: id,
        action: `quick_${action}`,
        record_id: selectedRecord.id,
        old_value: selectedRecord.data?.[action] || "",
        new_value: value || "",
      });
      
      toast.success(`${action} updated`);
    } catch (e: any) {
      toast.error(`Failed to update ${action}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormValues({ ...formValues, [e.target.name]: e.target.value });
  };

  const saveRow = async () => {
    if (!id) return;
    
    // Validate required fields
    for (const col of (colsData || [])) {
      const typeInfo = parseColumnType(col.data_type);
      if (typeInfo.required) {
        const value = formValues[col.name];
        if (value === undefined || value === null || String(value).trim() === "") {
          toast.warning(`Entry incomplete. Please fill out required field: [${col.display_name}]`);
          return;
        }
      }
    }

    try {
      const newRow = await createRow(id, formValues);
      
      // Audit log entry
      logAudit({
        user_id: appUser?.id?.toString() || "anonymous",
        worksheet_id: id,
        action: "row_added",
        record_id: newRow?.id,
        new_value: JSON.stringify(formValues),
      });

      toast.success("New row appended to worksheet");
      refetchRows();
      closeAddModal();
    } catch {
      toast.error("Failed to append row node.");
    }
  };

  const deleteRowHandler = async (rowId: string) => {
    if (!canDelete) {
      toast.error("Insufficient permissions to delete rows.");
      return;
    }
    openDeleteConfirm(rowId);
  };

  const handleBulkDelete = async () => {
    if (!canDelete) {
      toast.error("Insufficient permissions to delete rows.");
      return;
    }
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Are you sure you want to delete the ${selectedIds.size} selected row(s)?`)) return;

    try {
      const rowsToDelete = localRows.filter(r => selectedIds.has(r.id));
      const deletePromises = Array.from(selectedIds).map(rowId => deleteRow(id!, rowId));
      await Promise.all(deletePromises);

      // Save to undo history
      setLastDeletedRows(rowsToDelete);
      setUndoCountdown(8);
      setShowUndo(true);

      // Log audit
      logAudit({
        user_id: appUser?.id?.toString() || "anonymous",
        worksheet_id: id!,
        action: "bulk_row_deleted",
        old_value: JSON.stringify(rowsToDelete.map(r => r.data)),
      });

      toast.success(`Deleted ${selectedIds.size} row entry(s)`);
      setSelectedIds(new Set());
      refetchRows();
    } catch {
      toast.error("Failed to delete selected rows.");
    }
  };

  const handleUndo = async () => {
    if (!id || !lastDeletedRows || lastDeletedRows.length === 0) return;
    try {
      const restorePromises = lastDeletedRows.map(row => createRow(id, row.data));
      await Promise.all(restorePromises);

      logAudit({
        user_id: appUser?.id?.toString() || "anonymous",
        worksheet_id: id,
        action: "delete_undone",
        new_value: JSON.stringify(lastDeletedRows.map(r => r.data)),
      });

      toast.success("Deletion undone. Rows restored.");
      setLastDeletedRows(null);
      setShowUndo(false);
      refetchRows();
    } catch {
      toast.error("Failed to restore deleted rows.");
    }
  };

  const handleExportExcel = () => {
    if (!wsData?.title || !colsData || !filteredRows) return;
    const exportCols = colsData.map(c => ({ header: c.display_name, accessor: c.name }));
    const filename = `${wsData.title.toLowerCase().replace(/\s+/g, "_")}_export.xlsx`;
    exportToExcel(wsData.title, exportCols, filteredRows, filename);
    toast.success("Excel document download initialized");
  };

  const handleExportCSV = () => {
    if (!wsData?.title || !colsData || !filteredRows) return;
    const exportCols = colsData.map(c => ({ header: c.display_name, accessor: c.name }));
    const filename = `${wsData.title.toLowerCase().replace(/\s+/g, "_")}_export.csv`;
    exportToCSV(wsData.title, exportCols, filteredRows, filename);
    toast.success("CSV file download initialized");
  };

  const handleExportPDF = () => {
    exportToPDF();
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Row filtering, search, and sorting logic
  const filteredRows = useMemo(() => {
    let result = [...localRows];

    // 0. Smart View Filters
    if (smartView !== "All") {
      const isMyRecords = smartView === "My Records";
      const isPending = smartView === "Pending";
      const isCompleted = smartView === "Completed";
      const isHighPriority = smartView === "High Priority";
      const isRecent = smartView === "Recently Updated";
      
      result = result.filter((row: any) => {
        const data = row.data || {};
        const status = String(data.status || "").toLowerCase();
        const priority = String(data.priority || "").toLowerCase();
        
        if (isMyRecords) {
          const rowOwnerId = data.recruiter || data.owner || data.assigned_to;
          return rowOwnerId === appUser?.id || rowOwnerId === appUser?.username;
        }
        if (isPending) return !status.includes("complete") && !status.includes("done");
        if (isCompleted) return status.includes("complete") || status.includes("done");
        if (isHighPriority) return priority.includes("high") || priority.includes("urgent");
        if (isRecent) {
          const rowDate = new Date(row.updated_at || row.created_at || 0);
          const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
          return rowDate.getTime() > dayAgo;
        }
        return true;
      });
    }

    // 1. Global Search
    if (rowSearch) {
      const term = rowSearch.toLowerCase();
      result = result.filter((row: any) => {
        const data = row.data || {};
        return Object.values(data).some((val: any) => 
          String(val || "").toLowerCase().includes(term)
        );
      });
    }

    // 2. Column Filters
    if (showFilters) {
      Object.entries(columnFilters).forEach(([field, filterVal]) => {
        if (!filterVal) return;
        const term = filterVal.toLowerCase();
        result = result.filter((row: any) => {
          const val = row.data?.[field];
          return String(val || "").toLowerCase().includes(term);
        });
      });
    }

    // 3. Sorting
    if (sortField && sortDirection) {
      result.sort((a: any, b: any) => {
        const aVal = a.data?.[sortField];
        const bVal = b.data?.[sortField];
        
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
        }

        const aStr = String(aVal || "").toLowerCase();
        const bStr = String(bVal || "").toLowerCase();
        
        if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
        if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [localRows, rowSearch, columnFilters, showFilters, sortField, sortDirection]);

  // Build columns configuration dynamically from column metadata
  const columns = useMemo(() => {
    if (!colsData || colsData.length === 0) return [];
    
    // Filter hidden columns
    const visibleCols = (colsData || []).filter((col: any) => !col.hidden);
    
    // Checkbox selector column
    const checkboxCol = {
      header: "",
      accessor: "select-row-col",
      Header: () => {
        const allPageSelected = filteredRows.length > 0 && filteredRows.every(r => selectedIds.has(r.id));
        return (
          <div className="flex justify-center items-center">
            <input
              type="checkbox"
              checked={allPageSelected}
              onChange={(e) => {
                const checked = e.target.checked;
                setSelectedIds(prev => {
                  const next = new Set(prev);
                  filteredRows.forEach(r => {
                    if (checked) next.add(r.id);
                    else next.delete(r.id);
                  });
                  return next;
                });
              }}
              className="accent-primary w-4 h-4 cursor-pointer rounded border-cyan-500/30 bg-black/40 text-primary focus:ring-primary focus:ring-offset-0"
            />
          </div>
        );
      },
      render: (row: any) => (
        <div className="flex justify-center items-center">
          <input
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={(e) => {
              const checked = e.target.checked;
              setSelectedIds(prev => {
                const next = new Set(prev);
                if (checked) next.add(row.id);
                else next.delete(row.id);
                return next;
              });
            }}
            className="accent-primary w-4 h-4 cursor-pointer rounded border-cyan-500/30 bg-black/40 text-primary focus:ring-primary focus:ring-offset-0"
          />
        </div>
      )
    };
    
    const base = visibleCols.map((col: any, index: number) => {
      const key = col.name;
      const displayHeader = col.display_name;
      
      return {
        header: displayHeader,
        accessor: key,
        Header: () => {
          const isEditingHeader = editingHeader === key;
          if (isEditingHeader) {
            return (
              <input
                type="text"
                value={headerInput}
                className="w-full px-1.5 py-0.5 bg-[#0F172A] text-[#E2E8F0] border border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono text-xs rounded"
                onChange={(e) => setHeaderInput(e.target.value)}
                onBlur={() => saveHeader(key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  else if (e.key === "Escape") cancelHeaderEdit();
                }}
                autoFocus
              />
            );
          }
          return (
            <div className="flex flex-col gap-1 items-start w-full min-w-[120px]">
              <div className="flex items-center justify-between w-full gap-2">
                <div
                  className="cursor-pointer hover:text-primary py-1 font-mono tracking-wider font-bold text-left text-primary/80 uppercase text-[10px] flex items-center gap-1 flex-1 truncate"
                  onClick={() => handleSort(key)}
                  title="Click to sort"
                >
                  <span className="truncate">{displayHeader}</span>
                  {sortField === key && (
                    <span className="text-primary text-[9px]">
                      {sortDirection === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </div>
                {canEdit && (
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        startHeaderEdit(key, displayHeader);
                      }}
                      className="text-slate-500 hover:text-primary cursor-pointer text-[10px]"
                      title="Rename"
                    >
                      ✏️
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleColumnHidden(key, col.hidden || false);
                      }}
                      className="text-slate-500 hover:text-primary cursor-pointer text-[10px]"
                      title="Hide"
                    >
                      👁️
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        moveColumnLeft(key, index);
                      }}
                      className="text-slate-500 hover:text-primary cursor-pointer text-[10px]"
                      title="Move Left"
                      style={{ opacity: index === 0 ? 0.3 : 1, pointerEvents: index === 0 ? 'none' : 'auto' }}
                    >
                      ←
                    </span>
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        moveColumnRight(key, index, visibleCols.length);
                      }}
                      className="text-slate-500 hover:text-primary cursor-pointer text-[10px]"
                      title="Move Right"
                      style={{ opacity: index === visibleCols.length - 1 ? 0.3 : 1, pointerEvents: index === visibleCols.length - 1 ? 'none' : 'auto' }}
                    >
                      →
                    </span>
                  </div>
                )}
              </div>
              {showFilters && (
                <input
                  type="text"
                  placeholder={`Filter...`}
                  value={columnFilters[key] || ""}
                  onChange={(e) => setColumnFilters(prev => ({ ...prev, [key]: e.target.value }))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-1.5 py-0.5 bg-[#0a0f1d] text-[#E2E8F0] border border-cyan-500/20 focus:border-cyan-400 focus:outline-none font-mono text-[9px] rounded text-left"
                />
              )}
            </div>
          );
        },
        render: (row: any) => {
          const isEditing = editingCell && editingCell.rowId === row.id && editingCell.accessor === key;
          const cellValue = row.data?.[key] !== undefined ? row.data[key] : "";
          
          if (isEditing) {
            const colMeta = colsData?.find((c: any) => c.name.replace(/[^0-9a-zA-Z_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '').toLowerCase() === key);
            const typeInfo = colMeta ? parseColumnType(colMeta.data_type) : { baseType: "Text", options: [] as string[], required: false, defaultValue: "" };
            
            if (typeInfo.baseType === "Single Select") {
              return (
                <select
                  defaultValue={cellValue}
                  className="w-full px-2 py-1 bg-[#0a0f1d] text-[#E2E8F0] border border-cyan-500 focus:outline-none font-mono text-xs rounded"
                  onBlur={(e) => commitEdit(row.id, key, e.target.value)}
                  onChange={(e) => commitEdit(row.id, key, e.target.value)}
                  autoFocus
                >
                  <option value="">-- Select --</option>
                  {typeInfo.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              );
            }
            if (typeInfo.baseType === "Boolean") {
              return (
                <select
                  defaultValue={String(cellValue)}
                  className="w-full px-2 py-1 bg-[#0a0f1d] text-[#E2E8F0] border border-cyan-500 focus:outline-none font-mono text-xs rounded"
                  onBlur={(e) => commitEdit(row.id, key, e.target.value)}
                  onChange={(e) => commitEdit(row.id, key, e.target.value)}
                  autoFocus
                >
                  <option value="">-- Select --</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              );
            }
            if (typeInfo.baseType === "Date") {
              return (
                <input
                  type="date"
                  defaultValue={cellValue}
                  className="w-full px-2 py-1 bg-[#0a0f1d] text-[#E2E8F0] border border-cyan-500 focus:outline-none font-mono text-xs rounded"
                  onBlur={(e) => commitEdit(row.id, key, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    else if (e.key === "Escape") cancelEdit();
                  }}
                  autoFocus
                />
              );
            }
            if (typeInfo.baseType === "DateTime") {
              return (
                <input
                  type="datetime-local"
                  defaultValue={cellValue}
                  className="w-full px-2 py-1 bg-[#0a0f1d] text-[#E2E8F0] border border-cyan-500 focus:outline-none font-mono text-xs rounded"
                  onBlur={(e) => commitEdit(row.id, key, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    else if (e.key === "Escape") cancelEdit();
                  }}
                  autoFocus
                />
              );
            }
            if (typeInfo.baseType === "Number") {
              return (
                <input
                  type="number"
                  defaultValue={cellValue}
                  className="w-full px-2 py-1 bg-[#0a0f1d] text-[#E2E8F0] border border-cyan-500 focus:outline-none font-mono text-xs rounded"
                  onBlur={(e) => commitEdit(row.id, key, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                    else if (e.key === "Escape") cancelEdit();
                  }}
                  autoFocus
                />
              );
            }
            return (
              <input
                type="text"
                defaultValue={cellValue}
                className="w-full px-2 py-1 bg-[#0a0f1d] text-[#E2E8F0] border border-cyan-500 focus:outline-none focus:shadow-[0_0_10px_rgba(0,229,255,0.15)] font-mono text-xs rounded"
                onBlur={(e) => commitEdit(row.id, key, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    (e.target as HTMLInputElement).blur();
                  } else if (e.key === "Escape") {
                    cancelEdit();
                  }
                }}
                autoFocus
              />
            );
          }
          return (
            <div
              className="cursor-pointer hover:bg-[rgba(0,229,255,0.06)] min-h-[24px] px-2 py-1 flex items-center justify-start font-mono text-xs tracking-wide transition-colors"
              onClick={() => startEdit(row.id, key)}
              title="Double click to edit cell value"
            >
              {cellValue === null || cellValue === undefined ? "" : String(cellValue)}
            </div>
          );
        },
      };
    });

    // Append actions column
    return [
      checkboxCol,
      ...base,
      {
        header: "ACTIONS",
        accessor: "actions",
        Header: () => (
          <div className="text-center font-mono text-[10px] text-primary/80 font-bold uppercase tracking-wider">
            ACTIONS
          </div>
        ),
        render: (row: any) => (
          canDelete ? (
            <div className="flex justify-center">
              <button
                onClick={() => deleteRowHandler(row.id)}
                className="text-[9px] font-bold tracking-widest font-mono uppercase bg-rose-950/30 border border-[#FF4D6D]/30 text-[#FF4D6D] hover:bg-[#FF4D6D]/15 px-2 py-0.5 rounded transition"
              >
                Delete
              </button>
            </div>
          ) : null
        ),
      },
    ];
  }, [colsData, editingCell, editingHeader, headerInput, canDelete, localRows, sortField, sortDirection, columnFilters, showFilters, selectedIds, filteredRows]);

  // Handle loading and error view states
  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title={id ? getCleanSheetName(id, "") : ""} subtitle="Worksheet Data View" />
        <div className="p-10 text-center font-mono text-muted animate-pulse border border-[#00E5FF]/15 bg-black/40 rounded-xl">
          Retrieving dynamic worksheet schemas and rows...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader title={id ? getCleanSheetName(id, "") : ""} subtitle="Worksheet Data View" />
        <CyberCard className="p-8 text-center border-danger/40">
          <p className="text-danger font-mono mb-4">[CRITICAL ERROR]: Unable to synchronize worksheet nodes.</p>
          <p className="text-slate-400 text-xs mb-2">(Cols Error: {isColsError ? "YES" : "NO"} / Rows Error: {isRowsError ? "YES" : "NO"})</p>
          <CyberButton onClick={refetchAll}>Retry Link</CyberButton>
        </CyberCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={id ? getCleanSheetName(id, wsData?.title || "") : ""} subtitle="Worksheet Data View" />
      
      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <CyberCard className="flex items-center justify-between gap-4 border-rose-500/30 bg-rose-950/10 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
          <div className="flex items-center gap-2 font-mono text-xs text-rose-400">
            <span>☣</span>
            <span>{selectedIds.size} ROW(S) SELECTED FOR DE-ORBITAL BOMBARDMENT</span>
          </div>
          <div className="flex gap-2">
            <CyberButton
              variant="secondary"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Cancel
            </CyberButton>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest bg-rose-950/30 hover:bg-rose-900/20 border border-rose-500/30 hover:border-rose-500 text-rose-400 shadow-[0_0_8px_rgba(239,68,68,0.1)] rounded-lg transition-all"
            >
              BULK DELETE
            </button>
          </div>
        </CyberCard>
      )}

      {/* Control Actions Header Deck */}
      <CyberCard className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center font-mono text-xs text-primary/80 gap-3 w-full lg:w-auto">
          <div className="flex items-center space-x-3 flex-shrink-0">
            <span>ACCESS LEVEL:</span>
            <CyberBadge variant={role === 'Viewer' ? 'secondary' : 'primary'}>
              {role.toUpperCase()}
            </CyberBadge>
            <span>|</span>
            <span>ROWS:</span>
            <span className="text-[#00FF9D] font-bold">{localRows.length}</span>
          </div>
          <div className="w-full sm:w-60">
            <CyberInput
              type="text"
              placeholder="Search rows..."
              value={rowSearch}
              onChange={(e) => setRowSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          <CyberButton onClick={() => setShowFilters(prev => !prev)} variant="secondary" className="w-full sm:w-auto">
            {showFilters ? "Hide Filters" : "Show Filters"}
          </CyberButton>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {canEdit && (
              <CyberButton onClick={openRenameWsModal} variant="secondary" size="sm" className="flex-1 sm:flex-none">
                Rename
              </CyberButton>
            )}
            {canAdd && (
              <CyberButton onClick={openAddModal} variant="primary" className="flex-1 sm:flex-none">
                + Add Row Entry
              </CyberButton>
            )}
            {canManageColumns && (
              <CyberButton onClick={openAddColModal} variant="primary" className="flex-1 sm:flex-none">
                + Add Column
              </CyberButton>
            )}
            {canManageColumns && (
              <CyberButton onClick={openManageColsModal} variant="secondary" className="flex-1 sm:flex-none">
                Manage Columns
              </CyberButton>
            )}
            <CyberButton onClick={openAuditModal} variant="secondary" className="w-full sm:w-auto">
              Audit Trail Logs
            </CyberButton>
            <div className="flex gap-1 border-t sm:border-t-0 sm:border-l border-cyan-500/20 pt-2 sm:pt-0 sm:pl-2 w-full sm:w-auto justify-center sm:justify-start no-print">
              <button
                onClick={handleExportExcel}
                className="px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 rounded transition-all flex-1 sm:flex-none text-center"
                title="Export to Excel spreadsheet"
              >
                XLSX
              </button>
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 rounded transition-all flex-1 sm:flex-none text-center"
                title="Export to CSV values"
              >
                CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 rounded transition-all flex-1 sm:flex-none text-center"
                title="Export print PDF"
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </CyberCard>

      {/* Smart Views Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["All", "My Records", "Pending", "Completed", "High Priority", "Recently Updated"].map((view) => (
          <button
            key={view}
            className={`px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider rounded border transition-all ${
              smartView === view
                ? "bg-primary/20 border-primary text-primary"
                : "bg-cyberCard/50 border-cyan-500/20 text-slate-400 hover:text-primary hover:border-primary/40"
            }`}
            onClick={() => setSmartView(view)}
          >
            {view}
          </button>
        ))}
      </div>
      
      {/* View Mode Toggle */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-slate-500">View:</span>
          <button
            className={`px-3 py-1 rounded border transition-all ${
              viewMode === "card" ? "bg-primary/20 border-primary text-primary" : "border-cyan-500/20 text-slate-400"
            }`}
            onClick={() => setViewMode("card")}
          >
            Cards
          </button>
          <button
            className={`px-3 py-1 rounded border transition-all ${
              viewMode === "table" ? "bg-primary/20 border-primary text-primary" : "border-cyan-500/20 text-slate-400"
            }`}
            onClick={() => setViewMode("table")}
          >
            Table
          </button>
        </div>
      </div>
      
      {/* Main View - Card or Table */}
      {localRows.length === 0 ? (
        <CyberCard className="p-12 text-center border-cyan-500/20 bg-[#050b14]/40 shadow-[0_0_15px_rgba(0,229,255,0.02)]">
          <p className="text-cyan-400 font-mono text-xs tracking-wider uppercase animate-pulse">
            No records available for this sheet.
          </p>
        </CyberCard>
      ) : colsData && colsData.length > 0 ? (
        viewMode === "card" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRows.map((row: any) => {
              const data = row.data || {};
              const visibleCols = colsData.filter((c: any) => !c.hidden);
              
              // Identify key fields for preview (first 3 visible)
              const previewFields = visibleCols.slice(0, 3);
              
              return (
                <CyberCard 
                  key={row.id} 
                  className="hover:shadow-[0_0_20px_rgba(0,229,255,0.15)] transition-all duration-300"
                  onClick={() => openRecordDetail(row)}
                >
                  <div className="space-y-3">
                    {previewFields.map((col: any) => (
                      <div key={col.name} className="flex flex-col">
                        <span className="text-[10px] text-primary/60 uppercase tracking-wider font-bold">
                          {col.display_name}
                        </span>
                        <span className="text-slate-200 font-mono text-sm truncate">
                          {data[col.name] || <span className="text-slate-500 italic">Empty</span>}
                        </span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-cyan-500/20 flex justify-between items-center">
                      <span className="text-[10px] text-slate-500">
                        {visibleCols.length > 3 ? `+${visibleCols.length - 3} more fields` : "Full record"}
                      </span>
                      <span className="text-primary text-[10px] font-bold uppercase">Open Record →</span>
                    </div>
                  </div>
                </CyberCard>
              );
            })}
          </div>
        ) : (
          <CyberTable 
            columns={columns} 
            data={filteredRows}
            className="hover:shadow-[0_0_20px_rgba(0,229,255,0.02)] transition-all duration-300" 
          />
        )
      ) : (
        <div className="p-12 text-center text-muted border border-dashed border-cyan-500/20 rounded-xl font-mono text-sm">
          No columns defined in schemas. Add columns or ingest new spreadsheet data.
        </div>
      )}

      {/* Add Row Modal */}
      <CyberModal isOpen={isAddOpen} onClose={closeAddModal} title="Append Operator Entry">
        <form className="space-y-4 font-mono text-xs">
          <p className="text-slate-400 mb-2 leading-relaxed">
            Provide row cell inputs for the columns below. Blank values are blocked from database ingestion.
          </p>
          <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
            {(colsData || []).map((col: any) => {
              const typeInfo = parseColumnType(col.data_type);
              const isRequired = typeInfo.required;
              
              let inputField = null;
              if (typeInfo.baseType === "Single Select") {
                inputField = (
                  <select
                    name={col.name}
                    value={formValues[col.name] || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-[#0a0f1d] text-[#E2E8F0] border border-cyan-500/30 focus:border-cyan-400 focus:outline-none font-mono text-xs rounded"
                    required={isRequired}
                  >
                    <option value="">-- Select --</option>
                    {typeInfo.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                );
              } else if (typeInfo.baseType === "Multi Select") {
                const selectedList = formValues[col.name] ? formValues[col.name].split(",").map((s: string) => s.trim()).filter(Boolean) : [];
                const handleMultiChange = (opt: string, checked: boolean) => {
                  let newList = [...selectedList];
                  if (checked) {
                    if (!newList.includes(opt)) newList.push(opt);
                  } else {
                    newList = newList.filter((item: string) => item !== opt);
                  }
                  setFormValues(prev => ({ ...prev, [col.name]: newList.join(", ") }));
                };
                inputField = (
                  <div className="flex flex-wrap gap-2 p-2 border border-cyan-500/10 rounded bg-black/30">
                    {typeInfo.options.map((opt) => (
                      <label key={opt} className="flex items-center gap-1 cursor-pointer hover:text-white">
                        <input
                          type="checkbox"
                          checked={selectedList.includes(opt)}
                          onChange={(e) => handleMultiChange(opt, e.target.checked)}
                          className="rounded bg-[#0a0f1d] border-cyan-500/30 text-cyan-500 focus:ring-0 focus:ring-offset-0 text-xs"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                );
              } else if (typeInfo.baseType === "Boolean") {
                inputField = (
                  <select
                    name={col.name}
                    value={formValues[col.name] || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-[#0a0f1d] text-[#E2E8F0] border border-cyan-500/30 focus:border-cyan-400 focus:outline-none font-mono text-xs rounded"
                    required={isRequired}
                  >
                    <option value="">-- Select --</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                );
              } else if (typeInfo.baseType === "Long Text") {
                inputField = (
                  <textarea
                    name={col.name}
                    value={formValues[col.name] || ""}
                    onChange={handleInputChange}
                    placeholder={`Enter ${col.display_name}`}
                    className="w-full px-3 py-2 bg-[#0a0f1d] text-[#E2E8F0] border border-cyan-500/30 focus:border-cyan-400 focus:outline-none font-mono text-xs rounded"
                    required={isRequired}
                    rows={3}
                  />
                );
              } else {
                let inputType = "text";
                if (typeInfo.baseType === "Number") inputType = "number";
                else if (typeInfo.baseType === "Date") inputType = "date";
                else if (typeInfo.baseType === "DateTime") inputType = "datetime-local";
                else if (typeInfo.baseType === "Email") inputType = "email";
                else if (typeInfo.baseType === "Phone") inputType = "tel";
                else if (typeInfo.baseType === "URL") inputType = "url";
                
                inputField = (
                  <CyberInput
                    type={inputType}
                    name={col.name}
                    value={formValues[col.name] || ""}
                    onChange={handleInputChange}
                    placeholder={`Enter ${col.display_name}`}
                    required={isRequired}
                  />
                );
              }
              
              return (
                <div key={col.name} className="space-y-1">
                  <label className="block font-bold text-primary uppercase tracking-wider text-[10px]">
                    {col.display_name} {isRequired && <span className="text-rose-500 font-bold">*</span>}
                  </label>
                  {inputField}
                </div>
              );
            })}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-cyan-500/10">
            <CyberButton type="button" onClick={closeAddModal} variant="secondary">
              Cancel
            </CyberButton>
            <CyberButton type="button" onClick={saveRow} variant="primary">
              Save Entry
            </CyberButton>
          </div>
        </form>
      </CyberModal>

      {/* Audit History Modal */}
      <CyberModal isOpen={isAuditOpen} onClose={closeAuditModal} title={`Audit Trails: ${id}`}>
        <div className="max-h-96 overflow-y-auto font-mono text-xs">
          {auditLogs.length === 0 ? (
            <p className="text-center text-cyan-400 animate-pulse py-8">No audit logs logged in memory nodes.</p>
          ) : (
            <table className="w-full text-center border-collapse">
              <thead>
                <tr className="bg-black/60 text-primary border-b border-cyan-500/10 text-[10px] tracking-wider uppercase font-bold">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Operator ID</th>
                  <th className="p-3">Operation</th>
                  <th className="p-3">Prior Value</th>
                  <th className="p-3">New Value</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice().reverse().map((log) => (
                  <tr key={log.id} className="border-b border-cyan-500/5 hover:bg-[#00E5FF]/5 transition-colors">
                    <td className="p-3 whitespace-nowrap text-[10px] text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-[10px] max-w-[120px] truncate text-slate-400" title={log.user_id}>
                      {log.user_id}
                    </td>
                    <td className="p-3">
                      <CyberBadge variant={log.action === 'INSERT' || log.action === 'row_added' ? 'success' : log.action === 'DELETE' || log.action === 'row_deleted' ? 'danger' : 'primary'}>
                        {log.action.toUpperCase()}
                      </CyberBadge>
                    </td>
                    <td className="p-3 text-slate-400 max-w-[150px] truncate break-all select-all" title={log.old_value || ''}>
                      {log.old_value || '-'}
                    </td>
                    <td className="p-3 text-slate-300 max-w-[150px] truncate break-all select-all" title={log.new_value || ''}>
                      {log.new_value || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="flex justify-end pt-4 border-t border-cyan-500/10 mt-4">
          <CyberButton variant="secondary" onClick={closeAuditModal}>
            Close Logs
          </CyberButton>
        </div>
      </CyberModal>

{/* Rename Worksheet Modal */}
      <CyberModal isOpen={isRenameWsOpen} onClose={closeRenameWsModal} title="Rename Worksheet">
        <div className="space-y-4 font-mono text-xs">
          <p className="text-slate-400 mb-2 leading-relaxed">
            Enter a new title for this worksheet node.
          </p>
          <CyberInput
            type="text"
            placeholder="New worksheet title"
            value={renameWsTitle}
            onChange={(e) => setRenameWsTitle(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-cyan-500/10">
            <CyberButton type="button" onClick={closeRenameWsModal} variant="secondary">
              Cancel
            </CyberButton>
            <CyberButton type="button" onClick={saveWsRename} variant="primary">
              Save
            </CyberButton>
          </div>
        </div>
      </CyberModal>

      {/* Delete Confirmation Modal */}
      <CyberModal isOpen={isDeleteConfirmOpen} onClose={closeDeleteConfirm} title="Delete Record?">
        <div className="space-y-4 font-mono text-xs">
          <p className="text-slate-400">This action cannot be undone.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-cyan-500/10">
            <CyberButton type="button" onClick={closeDeleteConfirm} variant="secondary">
              Cancel
            </CyberButton>
            <CyberButton type="button" onClick={confirmDelete} variant="danger">
              Delete
            </CyberButton>
          </div>
        </div>
      </CyberModal>

      {/* Add Column Modal */}
      <CyberModal isOpen={isAddColOpen} onClose={closeAddColModal} title="Create New Column">
        <form className="space-y-4 font-mono text-xs" onSubmit={(e) => { e.preventDefault(); handleAddColumn(); }}>
          <div className="space-y-1">
            <label className="block font-bold text-primary uppercase tracking-wider text-[10px]">
              Column Name:
            </label>
            <CyberInput
              type="text"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              placeholder="e.g. Status"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label className="block font-bold text-primary uppercase tracking-wider text-[10px]">
              Data Type:
            </label>
            <select
              value={newColType}
              onChange={(e) => setNewColType(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0f1d] text-[#E2E8F0] border border-cyan-500/30 focus:border-cyan-400 focus:outline-none font-mono text-xs rounded"
            >
              {["Text", "Number", "Date", "DateTime", "Boolean", "Email", "Phone", "URL", "Long Text", "Single Select", "Multi Select"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {(newColType === "Single Select" || newColType === "Multi Select") && (
            <div className="space-y-1">
              <label className="block font-bold text-primary uppercase tracking-wider text-[10px]">
                Options (comma-separated):
              </label>
              <CyberInput
                type="text"
                value={newColOptions}
                onChange={(e) => setNewColOptions(e.target.value)}
                placeholder="e.g. Pending, In Progress, Completed, Rejected"
                required
              />
            </div>
          )}

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="newColRequired"
              checked={newColRequired}
              onChange={(e) => setNewColRequired(e.target.checked)}
              className="rounded bg-[#0a0f1d] border-cyan-500/30 text-cyan-500 focus:ring-0 focus:ring-offset-0"
            />
            <label htmlFor="newColRequired" className="font-bold text-primary uppercase tracking-wider text-[10px] cursor-pointer">
              Required
            </label>
          </div>

          <div className="space-y-1">
            <label className="block font-bold text-primary uppercase tracking-wider text-[10px]">
              Default Value:
            </label>
            {newColType === "Boolean" ? (
              <select
                value={newColDefault}
                onChange={(e) => setNewColDefault(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0f1d] text-[#E2E8F0] border border-cyan-500/30 focus:border-cyan-400 focus:outline-none font-mono text-xs rounded"
              >
                <option value="">No Default</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : newColType === "Single Select" ? (
              <select
                value={newColDefault}
                onChange={(e) => setNewColDefault(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0f1d] text-[#E2E8F0] border border-cyan-500/30 focus:border-cyan-400 focus:outline-none font-mono text-xs rounded"
              >
                <option value="">No Default</option>
                {newColOptions.split(",").map(o => o.trim()).filter(Boolean).map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <CyberInput
                type={newColType === "Number" ? "number" : newColType === "Date" ? "date" : newColType === "DateTime" ? "datetime-local" : "text"}
                value={newColDefault}
                onChange={(e) => setNewColDefault(e.target.value)}
                placeholder="e.g. N/A"
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-cyan-500/10">
            <CyberButton type="button" onClick={closeAddColModal} variant="secondary">
              Cancel
            </CyberButton>
            <CyberButton type="submit" variant="primary">
              Create Column
            </CyberButton>
          </div>
        </form>
      </CyberModal>

      {/* Manage Columns Modal */}
      <CyberModal isOpen={isManageColsOpen} onClose={closeManageColsModal} title="Manage Columns">
        <div className="space-y-4 font-mono text-xs max-h-[450px] overflow-y-auto pr-1">
          <p className="text-slate-400 mb-2 leading-relaxed">
            Reorder, rename, hide, show, or delete columns in this worksheet.
          </p>
          <div className="space-y-2">
            {(colsData || []).map((col: any, idx: number) => {
              const typeInfo = parseColumnType(col.data_type);
              const isEditing = editingColId === col.name;
              
              return (
                <div key={col.name} className="p-3 bg-[#0a0f1d] border border-cyan-500/20 rounded flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-1">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editingColName}
                          onChange={(e) => setEditingColName(e.target.value)}
                          className="px-2 py-1 bg-[#020617] text-slate-200 border border-cyan-500/40 rounded focus:outline-none focus:border-cyan-400 text-xs flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRenameCol(col.name, editingColName);
                            else if (e.key === "Escape") setEditingColId(null);
                          }}
                        />
                        <button
                          onClick={() => handleRenameCol(col.name, editingColName)}
                          className="px-2 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded text-[10px] font-bold uppercase hover:bg-cyan-500/30"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingColId(null)}
                          className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-[10px] font-bold uppercase hover:bg-slate-700"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 truncate">{col.display_name}</span>
                        <span className="text-[9px] text-[#00E5FF] px-1.5 py-0.2 bg-[#00E5FF]/10 rounded font-mono uppercase">
                          {typeInfo.baseType}
                        </span>
                        {col.hidden && (
                          <span className="text-[9px] text-slate-500 px-1.5 py-0.2 bg-slate-800 rounded font-mono uppercase">
                            Hidden
                          </span>
                        )}
                        {typeInfo.required && (
                          <span className="text-[9px] text-rose-500 px-1.5 py-0.2 bg-rose-550/10 rounded font-mono uppercase">
                            Required
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono">
                      DB Field Name: <span className="text-slate-400">{col.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingColId(col.name);
                          setEditingColName(col.display_name);
                        }}
                        className="p-1 text-slate-400 hover:text-[#00E5FF] transition-colors"
                        title="Rename"
                      >
                        ✏️
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleHideCol(col.name, col.hidden || false)}
                      className={`p-1 transition-colors ${col.hidden ? "text-slate-500 hover:text-white" : "text-[#00E5FF] hover:text-[#00E5FF]/70"}`}
                      title={col.hidden ? "Show Column" : "Hide Column"}
                    >
                      {col.hidden ? "👁️" : "🕶️"}
                    </button>
                    <button
                      onClick={() => handleMoveCol(col.name, "up", idx)}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                      title="Move Up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveCol(col.name, "down", idx)}
                      disabled={idx === (colsData || []).length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                      title="Move Down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => handleDeleteCol(col.name, col.display_name)}
                      className="p-1 text-rose-500 hover:text-rose-400 transition-colors ml-1"
                      title="Delete Column"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-cyan-500/10 mt-4">
          <CyberButton variant="secondary" onClick={closeManageColsModal}>
            Close
          </CyberButton>
        </div>
      </CyberModal>

      {/* Record Details Side Panel */}
      <CyberDrawer isOpen={isDetailOpen} onClose={closeRecordDetail} title="Record Details">
        {selectedRecord && (
          <div className="flex flex-col h-full space-y-5">
            {/* Record Header: ID, Created, Updated */}
            <div className="border-b border-cyan-500/20 pb-3 flex-shrink-0">
              <div className="grid grid-cols-1 gap-2 text-[10px] font-mono">
                <div className="flex justify-between">
                  <span className="text-primary/60 uppercase">Record ID:</span>
                  <span className="text-slate-300 font-bold">{selectedRecord.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary/60 uppercase">Created:</span>
                  <span className="text-slate-400">{selectedRecord.created_at ? new Date(selectedRecord.created_at).toLocaleString() : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-primary/60 uppercase">Updated:</span>
                  <span className="text-slate-400">{selectedRecord.updated_at ? new Date(selectedRecord.updated_at).toLocaleString() : '-'}</span>
                </div>
              </div>
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-2 min-h-0">
              {/* Record Details Form Fields */}
              <div className="space-y-4">
                {colsData && colsData.map((col: any) => {
                  const fieldName = col.display_name;
                  const fieldValue = detailEditValues[col.name] || "";
                  const inputClasses = "w-full px-3 py-2 bg-[#0a0f1d] text-[#E2E8F0] border border-cyan-500/30 focus:border-cyan-400 focus:outline-none font-mono text-sm rounded";
                  const typeInfo = parseColumnType(col.data_type);
                  
                  let inputField = null;
                  if (typeInfo.baseType === "Single Select") {
                    inputField = (
                      <select
                        value={fieldValue}
                        onChange={canEdit ? (e) => handleDetailFieldChange(col.name, e.target.value) : undefined}
                        className={inputClasses}
                        disabled={!canEdit}
                      >
                        <option value="">-- Select --</option>
                        {typeInfo.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    );
                  } else if (typeInfo.baseType === "Multi Select") {
                    const selectedList = fieldValue ? fieldValue.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
                    const handleMultiChange = (opt: string, checked: boolean) => {
                      let newList = [...selectedList];
                      if (checked) {
                        if (!newList.includes(opt)) newList.push(opt);
                      } else {
                        newList = newList.filter((item: string) => item !== opt);
                      }
                      handleDetailFieldChange(col.name, newList.join(", "));
                    };
                    inputField = (
                      <div className="flex flex-wrap gap-2 p-2 border border-cyan-500/20 rounded bg-black/40">
                        {typeInfo.options.map((opt) => (
                          <label key={opt} className="flex items-center gap-1 cursor-pointer hover:text-white">
                            <input
                              type="checkbox"
                              checked={selectedList.includes(opt)}
                              disabled={!canEdit}
                              onChange={(e) => handleMultiChange(opt, e.target.checked)}
                              className="rounded bg-[#0a0f1d] border-cyan-500/30 text-cyan-500 focus:ring-0 focus:ring-offset-0 text-xs"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    );
                  } else if (typeInfo.baseType === "Boolean") {
                    inputField = (
                      <select
                        value={String(fieldValue)}
                        onChange={canEdit ? (e) => handleDetailFieldChange(col.name, e.target.value) : undefined}
                        className={inputClasses}
                        disabled={!canEdit}
                      >
                        <option value="">-- Select --</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    );
                  } else if (typeInfo.baseType === "Long Text") {
                    inputField = (
                      <textarea
                        value={fieldValue}
                        onChange={canEdit ? (e) => handleDetailFieldChange(col.name, e.target.value) : undefined}
                        placeholder={`Enter ${fieldName}`}
                        className={inputClasses}
                        readOnly={!canEdit}
                        rows={3}
                      />
                    );
                  } else {
                    let inputType = "text";
                    if (typeInfo.baseType === "Number") inputType = "number";
                    else if (typeInfo.baseType === "Date") inputType = "date";
                    else if (typeInfo.baseType === "DateTime") inputType = "datetime-local";
                    else if (typeInfo.baseType === "Email") inputType = "email";
                    else if (typeInfo.baseType === "Phone") inputType = "tel";
                    else if (typeInfo.baseType === "URL") inputType = "url";
                    
                    inputField = (
                      <CyberInput
                        type={inputType}
                        value={fieldValue}
                        onChange={canEdit ? (e) => handleDetailFieldChange(col.name, e.target.value) : undefined}
                        placeholder={`Enter ${fieldName}`}
                        readOnly={!canEdit}
                      />
                    );
                  }
                  
                  return (
                    <div key={col.name} className="space-y-2">
                      <label className="block font-bold text-primary/80 uppercase tracking-wider text-[10px]">
                        {fieldName} {typeInfo.required && <span className="text-rose-500 font-bold">*</span>}
                      </label>
                      {inputField}
                    </div>
                  );
                })}
              </div>
              
              {/* Quick Actions */}
              <div className="pt-4 border-t border-cyan-500/20 space-y-3">
                <div className="text-[10px] text-primary/60 uppercase font-bold">Quick Actions</div>
                <div className="flex flex-wrap gap-2">
                  {["Status", "Priority", "Tag"].map((action) => (
                    <button
                      key={action}
                      className="px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-all"
                      onClick={() => {
                        const newVal = prompt(`Enter new ${action}:`);
                        if (newVal) handleQuickAction(action.toLowerCase(), newVal);
                      }}
                    >
                      {action}
                    </button>
                  ))}
                  <button
                    className="px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-wider rounded border border-success/30 text-success hover:bg-success/10 transition-all"
                    onClick={() => {
                      if (colsData?.some((c: any) => c.name === "status")) {
                        handleQuickAction("status", "Completed");
                      }
                    }}
                  >
                    ✓ Complete
                  </button>
                </div>
              </div>

              {/* Public Notes (Shared) */}
              <div className="pt-5 border-t border-cyan-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest neon-text-primary">
                    Public Notes (Shared)
                  </span>
                  <CyberBadge variant="primary">{publicNotes.length}</CyberBadge>
                </div>

                {/* Notes list */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {publicNotes.length === 0 ? (
                    <p className="text-[11px] font-mono text-slate-500 italic">No public notes yet.</p>
                  ) : (
                    publicNotes.map((note) => {
                      const isOwn = String(note.user_id) === String(appUser?.id);
                      const isEditing = editingNoteId === note.id;
                      const userDisplay = note.users?.username || getUserDisplayName(note.user_id);
                      const canDeleteN = isOwn || isSuperAdmin || role === "Admin";
                      return (
                        <div key={note.id} className="p-3 bg-[#0a0f1d] border border-cyan-500/10 rounded font-mono text-xs space-y-2">
                          <div className="flex items-center justify-between border-b border-cyan-500/5 pb-1 text-[10px]">
                            <span className="text-cyan-400 font-bold">{userDisplay}</span>
                            <span className="text-slate-500">{note.created_at ? new Date(note.created_at).toLocaleString() : ""}</span>
                          </div>
                          
                          {isEditing ? (
                            <div className="space-y-2 pt-1">
                              <textarea
                                className="w-full p-2 bg-[#020617] text-slate-200 border border-cyan-500/30 rounded focus:outline-none focus:border-cyan-400 text-xs"
                                value={editingNoteContent}
                                onChange={(e) => setEditingNoteContent(e.target.value)}
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => {
                                    setEditingNoteId(null);
                                    setEditingNoteContent("");
                                  }}
                                  className="px-2 py-1 bg-slate-800 text-slate-400 hover:bg-slate-700 rounded text-[10px] uppercase font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdateNote(note.id)}
                                  className="px-2 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-500/30 rounded text-[10px] uppercase font-bold"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-slate-300 break-words pt-1">{note.content}</p>
                          )}

                          {!isEditing && (isOwn || canDeleteN) && (
                            <div className="flex gap-2 justify-end text-[10px] pt-1">
                              {isOwn && (
                                <button
                                  onClick={() => {
                                    setEditingNoteId(note.id);
                                    setEditingNoteContent(note.content);
                                  }}
                                  className="text-cyan-500 hover:text-cyan-400 font-bold uppercase"
                                >
                                  Edit
                                </button>
                              )}
                              {canDeleteN && (
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="text-rose-500 hover:text-rose-400 font-bold uppercase"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Note Form */}
                <div className="space-y-2 pt-2">
                  <textarea
                    placeholder="Candidate requested interview after 4 PM..."
                    className="w-full p-2 bg-[#020617] text-[#E2E8F0] border border-cyan-500/20 focus:border-cyan-400 focus:outline-none font-mono text-xs rounded"
                    value={newPublicNoteContent}
                    onChange={(e) => setNewPublicNoteContent(e.target.value)}
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <CyberButton
                      type="button"
                      onClick={() => handleAddNote(false)}
                      variant="secondary"
                      size="sm"
                    >
                      Add Public Note
                    </CyberButton>
                  </div>
                </div>
              </div>

              {/* Private Notes (User Specific) */}
              <div className="pt-5 border-t border-cyan-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest neon-text-warning">
                    My Private Notes
                  </span>
                  <CyberBadge variant="warning">{privateNotes.length}</CyberBadge>
                </div>

                {/* Notes list */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {privateNotes.length === 0 ? (
                    <p className="text-[11px] font-mono text-slate-500 italic">No private notes yet.</p>
                  ) : (
                    privateNotes.map((note) => {
                      const isEditing = editingNoteId === note.id;
                      return (
                        <div key={note.id} className="p-3 bg-[#0a0f1d] border border-amber-500/10 rounded font-mono text-xs space-y-2">
                          <div className="flex items-center justify-between border-b border-amber-500/5 pb-1 text-[10px]">
                            <span className="text-amber-400 font-bold">Personal Note</span>
                            <span className="text-slate-500">{note.created_at ? new Date(note.created_at).toLocaleString() : ""}</span>
                          </div>
                          
                          {isEditing ? (
                            <div className="space-y-2 pt-1">
                              <textarea
                                className="w-full p-2 bg-[#020617] text-slate-200 border border-amber-500/30 rounded focus:outline-none focus:border-amber-400 text-xs"
                                value={editingNoteContent}
                                onChange={(e) => setEditingNoteContent(e.target.value)}
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => {
                                    setEditingNoteId(null);
                                    setEditingNoteContent("");
                                  }}
                                  className="px-2 py-1 bg-slate-800 text-slate-400 hover:bg-slate-700 rounded text-[10px] uppercase font-bold"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleUpdateNote(note.id)}
                                  className="px-2 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30 rounded text-[10px] uppercase font-bold"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="whitespace-pre-wrap text-slate-300 break-words pt-1">{note.content}</p>
                          )}

                          {!isEditing && (
                            <div className="flex gap-2 justify-end text-[10px] pt-1">
                              <button
                                onClick={() => {
                                  setEditingNoteId(note.id);
                                  setEditingNoteContent(note.content);
                                }}
                                className="text-amber-500 hover:text-amber-400 font-bold uppercase"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteNote(note.id)}
                                className="text-rose-500 hover:text-rose-400 font-bold uppercase"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Note Form */}
                <div className="space-y-2 pt-2">
                  <textarea
                    placeholder="Add a personal reminder..."
                    className="w-full p-2 bg-[#020617] text-[#E2E8F0] border border-amber-500/20 focus:border-amber-400 focus:outline-none font-mono text-xs rounded"
                    value={newPrivateNoteContent}
                    onChange={(e) => setNewPrivateNoteContent(e.target.value)}
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <CyberButton
                      type="button"
                      onClick={() => handleAddNote(true)}
                      variant="secondary"
                      size="sm"
                    >
                      Add Private Note
                    </CyberButton>
                  </div>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="pt-5 border-t border-cyan-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-widest neon-text-danger">
                    Activity Timeline
                  </span>
                  <CyberBadge variant="danger">{recordAuditLogs.length}</CyberBadge>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {recordAuditLogs.length === 0 ? (
                    <p className="text-[11px] font-mono text-slate-500 italic">No activity registered for this record.</p>
                  ) : (
                    recordAuditLogs.map((log) => {
                      const userDisplay = getUserDisplayName(log.user_id);
                      let message = "";
                      
                      switch (log.action) {
                        case "cell_updated":
                          message = `Updated field to "${log.payload?.new_value || ""}" (was "${log.payload?.old_value || ""}")`;
                          break;
                        case "row_added":
                          message = `Created record`;
                          break;
                        case "record_updated":
                          message = `Updated record details`;
                          break;
                        case "record_deleted":
                          message = `Deleted record`;
                          break;
                        case "public_note_added":
                          message = `Added public note: "${log.payload?.new_value || ""}"`;
                          break;
                        case "private_note_added":
                          message = `Added private note`;
                          break;
                        case "note_updated":
                          message = `Updated note content`;
                          break;
                        case "note_deleted":
                          message = `Deleted a note`;
                          break;
                        default:
                          message = log.action.replace(/_/g, " ");
                          break;
                      }

                      return (
                        <div key={log.id} className="p-2 bg-[#0a0f1d]/50 border border-cyan-500/5 rounded font-mono text-[10px] space-y-1">
                          <div className="flex justify-between text-slate-500">
                            <span className="text-rose-400 font-bold">{userDisplay}</span>
                            <span>{log.timestamp ? new Date(log.timestamp).toLocaleString() : ""}</span>
                          </div>
                          <p className="text-slate-300 break-words">{message}</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            
            {/* Action Buttons: Save, Delete, Close */}
            <div className="flex flex-col gap-2 pt-4 border-t border-cyan-500/20 flex-shrink-0">
              <CyberButton type="button" onClick={saveRecordDetail} variant="primary" className="w-full">
                Save Changes
              </CyberButton>
              
              {(canDelete || role === 'SuperAdmin') && (
                <CyberButton type="button" onClick={() => openDeleteConfirm(selectedRecord?.id)} variant="danger" className="w-full">
                  Delete Record
                </CyberButton>
              )}
              
              <CyberButton type="button" onClick={closeRecordDetail} variant="secondary" className="w-full">
                Close
              </CyberButton>
            </div>
          </div>
        )}
      </CyberDrawer>
       
       {/* Floating Cyber Undo Banner */}
      <AnimatePresence>
        {showUndo && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-between gap-6 px-6 py-4 bg-[#0a0f1d]/95 backdrop-blur-md border border-[#00E5FF]/40 shadow-[0_0_20px_rgba(0,229,255,0.25)] rounded-xl font-mono text-xs w-[calc(100%-2rem)] sm:w-[400px]"
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-primary" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-primary" />
            
            <div className="flex-1">
              <span className="text-primary font-bold animate-pulse">DELETION REGISTERED</span>
              <p className="text-slate-300 mt-1">{lastDeletedRows?.length} row(s) removed. Autoresolve in {undoCountdown}s.</p>
            </div>
            
            <button
              onClick={handleUndo}
              className="px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest bg-[#00FF9D]/10 hover:bg-[#00FF9D]/20 border border-[#00FF9D]/30 hover:border-[#00FF9D]/50 text-[#00FF9D] shadow-[0_0_8px_rgba(0,255,157,0.1)] hover:shadow-[0_0_15px_rgba(0,255,157,0.25)] rounded-lg transition-all duration-300"
            >
              UNDO
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Worksheet;
