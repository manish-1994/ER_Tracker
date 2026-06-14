import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../services/supabaseClient";
import { getWorkbooks } from "../services/workbookService";
import { getWorksheets } from "../services/worksheetService";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberButton } from "../components/ui/CyberButton";
import { CyberInput } from "../components/ui/CyberInput";
import { CyberStatCard } from "../components/ui/CyberStatCard";
import { PageHeader } from "../components/ui/PageHeader";
import { useToast } from "../context/ToastContext";
import { logAudit } from "../services/auditService";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  getDatabaseUsage,
  getStorageUsage,
  getDatabaseHealth,
  getModuleBreakdown,
  getWorkbookAnalysis,
  cleanupAuditLogs,
  cleanupTempFiles,
  cleanupOrphanedRecords,
  deleteEmptyWorkbooks,
  deleteTestWorkbooks,
} from "../services/storageService";

type CleanupAction =
  | "delete-logs"
  | "delete-workbook"
  | "delete-sheet"
  | "delete-dashboard-configs"
  | "delete-user-data"
  | "delete-temp-files"
  | "delete-all-workbooks"
  | "delete-all-dashboards"
  | "delete-all-logs"
  | "delete-all-temp"
  | "reset-dev-db"
  | "cleanup-orphaned"
  | "delete-empty"
  | "delete-test";

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const StorageManagement: React.FC = () => {
  const toast = useToast();
  const { appUser } = useAuth();
  
  // Cleanup states
  const [selectedWorkbookId, setSelectedWorkbookId] = useState<string>("");
  const [selectedSheetId, setSelectedSheetId] = useState<string>("");
  const [sheets, setSheets] = useState<any[]>([]);
  const [activeAction, setActiveAction] = useState<CleanupAction | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmStep1, setConfirmStep1] = useState(false);
  const [confirmStep2, setConfirmStep2] = useState(false);
  const [challengeInput, setChallengeInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const CHALLENGE_PHRASE = "SYSTEM OVERRIDE RESYNC";
  
  // Storage monitoring states
  const [workbookAnalysisTarget, setWorkbookAnalysisTarget] = useState<string>("");
  
  // Fetch storage metrics
  const { data: dbUsage, isLoading: dbLoading, refetch: refetchDb } = useQuery({
    queryKey: ["db-usage"],
    queryFn: getDatabaseUsage,
    refetchInterval: 30000,
  });
  
  const { data: storageUsage, isLoading: storageLoading, refetch: refetchStorage } = useQuery({
    queryKey: ["storage-usage"],
    queryFn: getStorageUsage,
    refetchInterval: 30000,
  });
  
  const { data: dbHealth, isLoading: healthLoading } = useQuery({
    queryKey: ["db-health"],
    queryFn: getDatabaseHealth,
  });
  
  const { data: moduleStats, isLoading: modulesLoading, refetch: refetchModules } = useQuery({
    queryKey: ["module-stats"],
    queryFn: getModuleBreakdown,
  });
  
  const { data: workbookAnalysis, isLoading: analysisLoading, refetch: refetchAnalysis } = useQuery({
    queryKey: ["workbook-analysis"],
    queryFn: getWorkbookAnalysis,
  });
  
  // Load workbooks
  const { data: workbooks, refetch: refetchWorkbooks } = useQuery({
    queryKey: ["cleanup-workbooks"],
    queryFn: getWorkbooks,
  });
  
  // Load sheets when workbook is selected
  useEffect(() => {
    if (!selectedWorkbookId) {
      setSheets([]);
      setSelectedSheetId("");
      return;
    }
    getWorksheets(selectedWorkbookId)
      .then((data) => {
        setSheets(data || []);
        if (data && data.length > 0) {
          setSelectedSheetId(data[0].id);
        } else {
          setSelectedSheetId("");
        }
      })
      .catch((err) => {
        console.error("Failed to load worksheets", err);
        setSheets([]);
      });
  }, [selectedWorkbookId]);
  
  const openConfirmation = (action: CleanupAction) => {
    setActiveAction(action);
    setConfirmStep1(false);
    setConfirmStep2(false);
    setChallengeInput("");
    setIsConfirmOpen(true);
  };
  
  const closeConfirmation = () => {
    setIsConfirmOpen(false);
    setActiveAction(null);
    setChallengeInput("");
  };
  
  const executeCleanup = async () => {
    if (!activeAction) return;
    if (challengeInput.trim() !== CHALLENGE_PHRASE) {
      toast.warning("Verification phrase does not match exactly.");
      return;
    }
    
    setIsProcessing(true);
    try {
      const actorId = appUser?.id ? String(appUser.id) : "anonymous";
      
      switch (activeAction) {
        case "delete-logs": {
          await cleanupAuditLogs(actorId);
          await logAudit({
            user_id: actorId,
            worksheet_id: "0",
            action: "storage_purge_logs",
          });
          toast.success("All local and database audit logs purged successfully.");
          refetchModules();
          break;
        }
        case "delete-workbook": {
          if (!selectedWorkbookId) {
            toast.warning("No workbook selected for deletion.");
            setIsProcessing(false);
            return;
          }
          const sheetsToPurge = sheets;
          for (const s of sheetsToPurge) {
            localStorage.removeItem(`local_rows_${s.id}`);
            localStorage.removeItem(`sheet_table_map_${s.id}`);
            await supabase.from("columns").delete().eq("sheet_id", s.id);
          }
          await supabase.from("sheets").delete().eq("workbook_id", selectedWorkbookId);
          await supabase.from("workbooks").delete().eq("id", selectedWorkbookId);
          
          await logAudit({
            user_id: actorId,
            worksheet_id: "0",
            action: "storage_delete_workbook",
            old_value: selectedWorkbookId,
          });
          toast.success("Workbook and all matching sheet nodes purged.");
          setSelectedWorkbookId("");
          refetchWorkbooks();
          refetchModules();
          refetchAnalysis();
          break;
        }
        case "delete-sheet": {
          if (!selectedSheetId) {
            toast.warning("No worksheet selected for deletion.");
            setIsProcessing(false);
            return;
          }
          localStorage.removeItem(`local_rows_${selectedSheetId}`);
          localStorage.removeItem(`sheet_table_map_${selectedSheetId}`);
          await supabase.from("columns").delete().eq("sheet_id", selectedSheetId);
          await supabase.from("sheets").delete().eq("id", selectedSheetId);
          
          await logAudit({
            user_id: actorId,
            worksheet_id: selectedSheetId,
            action: "storage_delete_worksheet",
          });
          toast.success("Worksheet data and metadata purged.");
          setSelectedSheetId("");
          if (selectedWorkbookId) {
            getWorksheets(selectedWorkbookId).then(setSheets);
          }
          refetchModules();
          refetchAnalysis();
          break;
        }
        case "delete-dashboard-configs": {
          localStorage.removeItem("dashboard_assignments");
          await logAudit({
            user_id: actorId,
            worksheet_id: "0",
            action: "storage_purge_dashboards",
          });
          toast.success("Custom dashboard configurations wiped.");
          refetchModules();
          break;
        }
        case "delete-user-data": {
          const { data: userRoles } = await supabase.from("user_roles").select("user_id").eq("role_id", 1);
          const adminUserIds = (userRoles || []).map((ur) => ur.user_id);
          
          const { error } = await supabase
            .from("users")
            .delete()
            .not("id", "in", `(${adminUserIds.join(",")})`);
            
          if (error) throw error;
          
          await logAudit({
            user_id: actorId,
            worksheet_id: "0",
            action: "storage_purge_user_data",
          });
          toast.success("All secondary user profiles successfully deleted.");
          refetchModules();
          break;
        }
        case "delete-temp-files": {
          const count = await cleanupTempFiles();
          await logAudit({
            user_id: actorId,
            worksheet_id: "0",
            action: "storage_purge_temp",
          });
          toast.success(`Cleared ${count} temporary caching directories.`);
          refetchModules();
          break;
        }
        case "cleanup-orphaned": {
          await cleanupOrphanedRecords();
          await logAudit({
            user_id: actorId,
            worksheet_id: "0",
            action: "storage_cleanup_orphaned",
          });
          toast.success("Orphaned records cleaned.");
          refetchModules();
          break;
        }
        case "delete-empty": {
          const deleted = await deleteEmptyWorkbooks(actorId);
          await logAudit({
            user_id: actorId,
            worksheet_id: "0",
            action: "storage_delete_empty_workbooks",
            old_value: String(deleted),
          });
          toast.success(`Deleted ${deleted} empty workbooks.`);
          refetchWorkbooks();
          refetchModules();
          refetchAnalysis();
          break;
        }
        case "delete-test": {
          const deleted = await deleteTestWorkbooks(actorId);
          await logAudit({
            user_id: actorId,
            worksheet_id: "0",
            action: "storage_delete_test_workbooks",
            old_value: String(deleted),
          });
          toast.success(`Deleted ${deleted} test workbooks.`);
          refetchWorkbooks();
          refetchModules();
          refetchAnalysis();
          break;
        }
        case "delete-all-workbooks": {
          await supabase.from("columns").delete().neq("id", 0);
          await supabase.from("sheets").delete().neq("id", 0);
          await supabase.from("workbooks").delete().neq("id", 0);
          
          const keys = Object.keys(localStorage);
          keys.forEach((key) => {
            if (key.startsWith("local_rows_") || key.startsWith("sheet_table_map_")) {
              localStorage.removeItem(key);
            }
          });
          
          await logAudit({
            user_id: actorId,
            worksheet_id: "0",
            action: "storage_purge_all_workbooks",
          });
          toast.success("All system workbooks deleted.");
          setSelectedWorkbookId("");
          refetchWorkbooks();
          refetchModules();
          refetchAnalysis();
          break;
        }
        case "reset-dev-db": {
          await supabase.from("columns").delete().neq("id", 0);
          await supabase.from("sheets").delete().neq("id", 0);
          await supabase.from("workbooks").delete().neq("id", 0);
          await supabase.from("audit_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
          
          const currentUserId = appUser?.id;
          if (currentUserId) {
            await supabase.from("user_roles").delete().neq("user_id", currentUserId);
            await supabase.from("users").delete().neq("id", currentUserId);
          }
          
          const appUserVal = localStorage.getItem("appUser");
          localStorage.clear();
          if (appUserVal) {
            localStorage.setItem("appUser", appUserVal);
          }
          
          await logAudit({
            user_id: actorId,
            worksheet_id: "0",
            action: "system_full_reset",
          });
          
          toast.success("Development database reset successful. Reloading environment...");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          break;
        }
        default:
          toast.error("Cleanup action unrecognized.");
      }
      closeConfirmation();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to complete cleanup protocol.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getActionTitle = () => {
    switch (activeAction) {
      case "delete-logs":
        return "Purge System Audit Trail Logs";
      case "delete-workbook":
        return "Delete Specific Workbook Cluster";
      case "delete-sheet":
        return "Delete Specific Worksheet Node";
      case "delete-dashboard-configs":
        return "Delete Layout Dashboard Configs";
      case "delete-user-data":
        return "Purge User Profiles Database";
      case "delete-temp-files":
        return "Clear Local Terminal Cache Caches";
      case "delete-all-workbooks":
        return "Purge All System Workbooks";
      case "cleanup-orphaned":
        return "Clean Up Orphaned Records";
      case "delete-empty":
        return "Delete Empty Workbooks";
      case "delete-test":
        return "Delete Test Workbooks";
      case "reset-dev-db":
        return "RESET SYSTEM DEVELOPMENT DATABASE";
      default:
        return "Emergency Override Protocol";
    }
  };
  
  const isChallengeValid =
    confirmStep1 && confirmStep2 && challengeInput.trim() === CHALLENGE_PHRASE;
  
  const getWarningVariant = (percentage: number): "primary" | "warning" | "danger" => {
    if (percentage >= 90) return "danger";
    if (percentage >= 75) return "warning";
    return "primary";
  };
  
  // Trend chart data (mock for now)
  const trendData = [
    { day: "Mon", value: 20 },
    { day: "Tue", value: 22 },
    { day: "Wed", value: 25 },
    { day: "Thu", value: 23 },
    { day: "Fri", value: 28 },
    { day: "Sat", value: 30 },
    { day: "Sun", value: 32 },
  ];
  
  return (
    <div className="space-y-6">
      {/* Title Header */}
      <PageHeader
        title="Storage Management Center"
        subtitle="Monitor database usage, storage capacity, and execute cleanup operations"
      />
      
      {/* Warning Banner for High Usage */}
      {((dbUsage?.percentage ?? 0) > 75 || (storageUsage?.percentage ?? 0) > 75) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-danger/10 border border-danger/40 rounded-lg flex items-center gap-3"
        >
          <span className="text-danger text-lg">⚠️</span>
          <div>
            <div className="font-mono font-bold text-danger uppercase text-sm">
              CAPACITY WARNING
            </div>
            <div className="text-xs text-danger/80">
              Storage usage exceeds {Math.max(dbUsage?.percentage ?? 0, storageUsage?.percentage ?? 0)}%. Consider cleanup operations.
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Storage Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CyberStatCard
          title="Database Used"
          value={dbLoading ? "..." : formatBytes(dbUsage?.used ?? 0)}
          subtitle={`${dbUsage?.percentage.toFixed(0) ?? 0}% of 500 MB`}
          variant={getWarningVariant(dbUsage?.percentage ?? 0)}
        />
        <CyberStatCard
          title="Storage Used"
          value={storageLoading ? "..." : formatBytes(storageUsage?.used ?? 0)}
          subtitle={`${storageUsage?.percentage.toFixed(0) ?? 0}% of 5 GB`}
          variant={getWarningVariant(storageUsage?.percentage ?? 0)}
        />
        <CyberStatCard
          title="Remaining Capacity"
          value={storageLoading ? "..." : formatBytes(storageUsage?.available ?? 0)}
          variant="success"
        />
        <CyberStatCard
          title="Usage Percentage"
          value={dbLoading ? "..." : `${dbUsage?.percentage.toFixed(0) ?? 0}%`}
          variant={getWarningVariant(dbUsage?.percentage ?? 0)}
        />
      </div>
      
      {/* Progress Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CyberCard variant="primary" className="space-y-3">
          <h3 className="text-sm font-bold tracking-widest text-primary uppercase">
            Database Usage Progress
          </h3>
          <div className="h-4 bg-[#050b14]/50 rounded-full overflow-hidden border border-cyan-500/20">
            <motion.div
              className={`h-full ${dbUsage?.percentage && dbUsage.percentage > 90 ? "bg-danger" : dbUsage?.percentage && dbUsage.percentage > 75 ? "bg-warning" : "bg-primary"}`}
              initial={{ width: 0 }}
              animate={{ width: `${dbUsage?.percentage ?? 0}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="text-xs text-muted font-mono">
            {dbLoading ? "Loading..." : `${formatBytes(dbUsage?.used ?? 0)} / 500 MB`}
          </div>
        </CyberCard>
        
        <CyberCard variant="primary" className="space-y-3">
          <h3 className="text-sm font-bold tracking-widest text-primary uppercase">
            Storage Usage Progress
          </h3>
          <div className="h-4 bg-[#050b14]/50 rounded-full overflow-hidden border border-cyan-500/20">
            <motion.div
              className={`h-full ${storageUsage?.percentage && storageUsage.percentage > 90 ? "bg-danger" : storageUsage?.percentage && storageUsage.percentage > 75 ? "bg-warning" : "bg-secondary"}`}
              initial={{ width: 0 }}
              animate={{ width: `${storageUsage?.percentage ?? 0}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="text-xs text-muted font-mono">
            {storageLoading ? "Loading..." : `${formatBytes(storageUsage?.used ?? 0)} / 5 GB`}
          </div>
        </CyberCard>
      </div>
      
      {/* Trend Chart */}
      <CyberCard variant="secondary" className="space-y-3">
        <h3 className="text-sm font-bold tracking-widest text-secondary uppercase border-b border-purple-500/25 pb-2">
          Weekly Growth Trend
        </h3>
        <div className="h-32 flex items-end justify-between gap-2 px-4">
          {trendData.map((d, i) => (
            <div key={d.day} className="flex flex-col items-center gap-1 flex-1">
              <motion.div
                className="w-full bg-secondary/20 rounded-t"
                initial={{ height: 0 }}
                animate={{ height: `${(d.value / 40) * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <div
                  className="w-full bg-secondary rounded-t"
                  style={{ height: "4px" }}
                />
              </motion.div>
              <span className="text-[10px] text-muted font-mono">{d.day}</span>
            </div>
          ))}
        </div>
      </CyberCard>
      
      {/* Module Breakdown Table */}
      <CyberCard variant="primary" className="space-y-3">
        <h3 className="text-sm font-bold tracking-widest text-primary uppercase border-b border-cyan-500/25 pb-2">
          Storage Consumption by Module
        </h3>
        <div className="max-h-64 overflow-y-auto">
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="border-b border-cyan-500/20">
                <th className="text-left py-2 text-primary uppercase">Module</th>
                <th className="text-right py-2 text-primary uppercase">Size</th>
                <th className="text-right py-2 text-primary uppercase">Records</th>
              </tr>
            </thead>
            <tbody>
              {modulesLoading ? (
                <tr>
                  <td colSpan={3} className="text-center py-4 text-muted">
                    Loading...
                  </td>
                </tr>
              ) : (
                moduleStats?.map((m) => (
                  <tr key={m.module} className="border-b border-cyan-500/5">
                    <td className="py-2 text-text">{m.module}</td>
                    <td className="py-2 text-right text-cyan-400">{m.sizeFormatted}</td>
                    <td className="py-2 text-right text-slate-400">{m.count.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CyberCard>
      
      {/* Workbook Storage Analysis */}
      <CyberCard variant="secondary" className="space-y-3">
        <h3 className="text-sm font-bold tracking-widest text-secondary uppercase border-b border-purple-500/25 pb-2">
          Workbook Storage Analysis
        </h3>
        <div className="max-h-80 overflow-y-auto">
          <table className="w-full font-mono text-xs">
            <thead>
              <tr className="border-b border-purple-500/20">
                <th className="text-left py-2 text-secondary uppercase">Workbook Name</th>
                <th className="text-right py-2 text-secondary uppercase">Sheets</th>
                <th className="text-right py-2 text-secondary uppercase">Rows</th>
                <th className="text-right py-2 text-secondary uppercase">Storage</th>
                <th className="text-right py-2 text-secondary uppercase">Last Modified</th>
                <th className="text-center py-2 text-secondary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {analysisLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    Loading...
                  </td>
                </tr>
              ) : (
                workbookAnalysis?.map((wb) => (
                  <tr key={wb.id} className="border-b border-purple-500/5">
                    <td className="py-2 text-text truncate max-w-[180px]">{wb.name}</td>
                    <td className="py-2 text-right text-slate-400">{wb.sheetCount}</td>
                    <td className="py-2 text-right text-slate-400">{wb.rowCount.toLocaleString()}</td>
                    <td className="py-2 text-right text-purple-400">{wb.storageFormatted}</td>
                    <td className="py-2 text-right text-slate-400">
                      {wb.lastModified ? new Date(wb.lastModified).toLocaleDateString() : "-"}
                    </td>
                    <td className="py-2 text-center">
                      <div className="flex justify-center gap-1">
                        <CyberButton
                          size="sm"
                          variant="secondary"
                          className="text-[10px] py-0.5 px-2"
                          onClick={() => setWorkbookAnalysisTarget(wb.id)}
                        >
                          Analyze
                        </CyberButton>
                        <CyberButton
                          size="sm"
                          variant="danger"
                          className="text-[10px] py-0.5 px-2"
                          onClick={() => {
                            setSelectedWorkbookId(wb.id);
                            openConfirmation("delete-workbook");
                          }}
                        >
                          Delete
                        </CyberButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CyberCard>
      
      {/* Database Health */}
      <CyberCard variant="primary" className="space-y-3">
        <h3 className="text-sm font-bold tracking-widest text-primary uppercase border-b border-cyan-500/25 pb-2">
          Database Health
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-mono font-bold text-primary">
              {healthLoading ? "..." : dbHealth?.totalTables ?? 0}
            </div>
            <div className="text-[10px] text-muted uppercase">Total Tables</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-success">
              {healthLoading ? "..." : (dbHealth?.totalRows ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-muted uppercase">Total Rows</div>
          </div>
          <div>
            <div className="text-lg font-mono font-bold text-secondary truncate">
              {healthLoading ? "..." : dbHealth?.largestTable ?? "-"}
            </div>
            <div className="text-[10px] text-muted uppercase">Largest Table</div>
          </div>
          <div>
            <div className="text-2xl font-mono font-bold text-warning">
              {healthLoading ? "..." : (dbHealth?.largestTableRows ?? 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-muted uppercase">Rows in Largest</div>
          </div>
        </div>
      </CyberCard>
      
      {/* Cleanup Center */}
      <CyberCard variant="secondary" className="space-y-3">
        <h3 className="text-sm font-bold tracking-widest text-secondary uppercase border-b border-purple-500/25 pb-2">
          Cleanup Center
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <CyberButton
            onClick={() => openConfirmation("delete-logs")}
            variant="danger"
            className="text-[10px]"
          >
            Delete Audit Logs
          </CyberButton>
          <CyberButton
            onClick={() => openConfirmation("delete-temp-files")}
            variant="warning"
            className="text-[10px]"
          >
            Delete Temp Files
          </CyberButton>
          <CyberButton
            onClick={() => openConfirmation("cleanup-orphaned")}
            variant="primary"
            className="text-[10px]"
          >
            Clean Orphaned Records
          </CyberButton>
          <CyberButton
            onClick={() => openConfirmation("delete-empty")}
            variant="warning"
            className="text-[10px]"
          >
            Delete Empty Workbooks
          </CyberButton>
          <CyberButton
            onClick={() => openConfirmation("delete-test")}
            variant="warning"
            className="text-[10px]"
          >
            Delete Test Data
          </CyberButton>
          <CyberButton
            onClick={() => openConfirmation("delete-all-workbooks")}
            variant="danger"
            className="text-[10px]"
          >
            Delete All Workbooks
          </CyberButton>
          <CyberButton
            onClick={() => {
              refetchDb();
              refetchStorage();
              refetchModules();
              refetchAnalysis();
              toast.success("Metrics refreshed");
            }}
            variant="success"
            className="text-[10px] col-span-2"
          >
            Refresh All Metrics
          </CyberButton>
        </div>
      </CyberCard>
      
      {/* Challenge / Override Confirmation Modal */}
      <AnimatePresence>
        {isConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-mono">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-[#040912] border border-red-500/50 rounded-lg p-6 relative overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.2)]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
              
              <h3 className="text-md font-black tracking-widest text-red-500 border-b border-red-500/20 pb-3 mb-4 uppercase flex items-center">
                <span className="mr-2">⚠️</span> Danger: Emergency Override Protocol
              </h3>
              
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-red-950/20 border border-red-500/10 text-red-400 rounded-lg leading-relaxed">
                  <div className="font-bold uppercase text-[11px] mb-1">Warning Notice:</div>
                  You are about to execute a destructive operation:
                  <div className="font-black text-text mt-1 uppercase text-sm">{getActionTitle()}</div>
                  This action clears live index nodes and cannot be undone.
                </div>
                
                {/* Checklist Step 1 */}
                <label className="flex items-start gap-3 p-2.5 border border-cyan-500/10 bg-[#050b14]/50 rounded cursor-pointer hover:bg-cyan-550/5">
                  <input
                    type="checkbox"
                    checked={confirmStep1}
                    onChange={(e) => setConfirmStep1(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-primary cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-text uppercase">Acknowledge Permanence</span>
                    <p className="text-[10px] text-slate-500">I verify this operation will wipe data cleanly from the system.</p>
                  </div>
                </label>
                
                {/* Checklist Step 2 */}
                <label className="flex items-start gap-3 p-2.5 border border-cyan-500/10 bg-[#050b14]/50 rounded cursor-pointer hover:bg-cyan-550/5">
                  <input
                    type="checkbox"
                    checked={confirmStep2}
                    onChange={(e) => setConfirmStep2(e.target.checked)}
                    className="w-4 h-4 mt-0.5 accent-primary cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-text uppercase">Clearance Authorization</span>
                    <p className="text-[10px] text-slate-500 font-sans leading-relaxed">
                      I warrant that I have the required authorization clearance to proceed.
                    </p>
                  </div>
                </label>
                
                {/* Text Challenge */}
                <div className="space-y-2">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Type Phrase to Unlock Override: <span className="text-red-400">{CHALLENGE_PHRASE}</span>
                  </label>
                  <CyberInput
                    value={challengeInput}
                    onChange={(e) => setChallengeInput(e.target.value)}
                    placeholder="Enter challenge phrase..."
                    className="w-full text-center tracking-widest text-red-500 font-bold border-red-500/30 focus:border-red-500"
                    disabled={isProcessing}
                  />
                </div>
                
                <div className="flex gap-3 pt-3">
                  <CyberButton
                    onClick={closeConfirmation}
                    variant="secondary"
                    className="flex-1 font-mono font-bold"
                    disabled={isProcessing}
                  >
                    Abort
                  </CyberButton>
                  <button
                    onClick={executeCleanup}
                    disabled={!isChallengeValid || isProcessing}
                    className="flex-[2] py-2 border border-red-500 text-red-500 bg-red-950/20 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-950/50 text-xs font-black uppercase tracking-widest rounded transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                  >
                    {isProcessing ? "Processing Purge..." : "EXECUTE OVERRIDE"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StorageManagement;