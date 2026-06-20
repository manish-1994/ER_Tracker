import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fetchRoles } from "../services/roleService";
import {
  getUsers,
  deleteUser,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
  resetUserPassword,
} from "../services/userService";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberButton } from "../components/ui/CyberButton";
import { CyberInput } from "../components/ui/CyberInput";
import { CyberTable, CyberColumn } from "../components/ui/CyberTable";
import { CyberBadge } from "../components/ui/CyberBadge";
import { CyberAvatar } from "../components/ui/CyberAvatar";
import { CyberModal } from "../components/ui/CyberModal";
import { CyberStatCard } from "../components/ui/CyberStatCard";
import { AlertTriangle, RefreshCw, Search, Shield, UserX, Key, Edit3, Trash2, Lock, Unlock } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   Cyberpunk Confirm Dialog
   Replaces all window.confirm() calls with a glassmorphic modal.
───────────────────────────────────────────────────────────────────────────── */
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "warning" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

const CyberConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "CONFIRM",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}) => {
  const variantColors = {
    danger:  { border: "border-danger/40", bg: "bg-danger/15", text: "text-danger", shadow: "" },
    warning: { border: "border-warning/40", bg: "bg-warning/15", text: "text-warning", shadow: "" },
    primary: { border: "border-accent/40", bg: "bg-accent/15", text: "text-accent", shadow: "" },
  }[confirmVariant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className={`bg-card-bg backdrop-blur-md border ${variantColors.border} rounded-2xl p-6 max-w-sm w-full mx-4 relative`}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full ${variantColors.bg} border ${variantColors.border} flex items-center justify-center flex-shrink-0`}>
                <AlertTriangle className={`w-5 h-5 ${variantColors.text}`} />
              </div>
              <div>
                <h3 className="text-sm font-sans font-bold text-white">{title}</h3>
              </div>
            </div>

            <p className="text-xs font-sans text-text-muted leading-relaxed mb-6 pl-1">
              {message}
            </p>

            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-xs font-sans font-bold uppercase tracking-widest border border-border text-text-muted hover:text-white hover:border-border rounded-lg transition"
              >
                ABORT
              </button>
              <button
                onClick={onConfirm}
                className={`flex-1 px-4 py-2 text-xs font-sans font-bold uppercase tracking-widest ${variantColors.bg} border ${variantColors.border} ${variantColors.text} hover:opacity-80 rounded-lg transition`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Loading Spinner
───────────────────────────────────────────────────────────────────────────── */
const CyberSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-16 gap-4">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
      className="w-10 h-10 border-2 border-accent/20 border-t-accent rounded-full"
    />
    <p className="text-xs font-sans tracking-widest text-accent/60 uppercase">Loading user registry...</p>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────────────────────── */
const UserManagement: React.FC = () => {
  const { appUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  // Search & Filter state
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  // Modal visibility
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Loading states for individual operations
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isSavingRoles, setIsSavingRoles] = useState(false);
  const [isSavingReset, setIsSavingReset] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<any>(null);

  // Cyberpunk confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    confirmVariant?: "danger" | "warning" | "primary";
    onConfirm: () => void;
  }>({ isOpen: false, title: "", message: "", onConfirm: () => { } });

  // Selected items
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  // Create User state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newRoleIds, setNewRoleIds] = useState<number[]>([]);
  const [createErrorMsg, setCreateErrorMsg] = useState("");

  // Edit User state
  const [editUsername, setEditUsername] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editErrorMsg, setEditErrorMsg] = useState("");

  // Reset Password state
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetErrorMsg, setResetErrorMsg] = useState("");

  /* ── Diagnostics ─────────────────────────────────────────────────────── */
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  /* ── Data Fetching ────────────────────────────────────────────────────── */
  const fetchData = async (silent = false) => {
    if (!silent) setIsLoadingData(true);
    setFetchError(null);
    try {
      const [usersData, rolesData] = await Promise.all([getUsers(), fetchRoles()]);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setLastRefresh(new Date());
    } catch (error: any) {
      console.error("USER MGMT FETCH ERROR", error);
      const msg = error?.message || error?.details || JSON.stringify(error);
      setFetchError(msg);
      if (!silent) toast.error("Failed to load user registry: " + msg);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  const openConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel = "CONFIRM",
    confirmVariant: "danger" | "warning" | "primary" = "danger"
  ) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm, confirmLabel, confirmVariant });
  };

  const closeConfirm = () =>
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));

  /* ── Delete User ─────────────────────────────────────────────────────── */
  const handleDelete = (user: any) => {
    // Guard: Cannot delete yourself
    if (appUser && user.id === appUser.id) {
      toast.error("Security Violation: You cannot delete the active session account.");
      return;
    }
    // Guard: Cannot delete last active SuperAdmin
    const isSuperAdmin = user.roles?.some(
      (r: any) => r.name?.toLowerCase() === "superadmin"
    );
    if (isSuperAdmin && user.is_active) {
      const activeSuperAdmins = users.filter(
        (u) =>
          u.is_active &&
          u.roles?.some((r: any) => r.name?.toLowerCase() === "superadmin")
      );
      if (activeSuperAdmins.length <= 1) {
        toast.error(
          "Security Violation: At least one active SuperAdmin must remain in the registry."
        );
        return;
      }
    }

openConfirm(
       `Terminate Operator: ${user.username}`,
       `This action will permanently de-register operator node [${user.username}] and revoke all system access. This operation cannot be undone.`,
       async () => {
         closeConfirm();
         try {
           const result = await deleteUser(user.id);
           toast.success(`Operator node [${user.username}] terminated and de-registered.`);
           await fetchData(true);
         } catch (err: any) {
           const errorMsg = err?.message || err?.details || "Failed to delete operator node.";
           toast.error(errorMsg);
         }
       },
       "TERMINATE",
       "danger"
     );
  };

  /* ── Toggle Status ───────────────────────────────────────────────────── */
  const handleToggleStatus = async (user: any) => {
    setTogglingUserId(user.id);
    try {
if (user.is_active) {
         // Deactivating
         if (appUser && user.id === appUser.id) {
           toast.error("Security Violation: Cannot deactivate active session account.");
           return;
         }
         const isSuperAdmin = user.roles?.some(
           (r: any) => r.name?.toLowerCase() === "superadmin"
         );
         if (isSuperAdmin) {
           const activeSuperAdmins = users.filter(
             (u) =>
               u.is_active &&
               u.roles?.some((r: any) => r.name?.toLowerCase() === "superadmin")
           );
           if (activeSuperAdmins.length <= 1) {
             toast.error(
               "Security Violation: At least one active SuperAdmin must remain in the system."
             );
             return;
           }
         }
         await deactivateUser(user.id);
         toast.warning(`Operator node [${user.username}] clearance suspended.`);
         await fetchData(true);
       } else {
         // Activating
         await activateUser(user.id);
         toast.success(`Operator node [${user.username}] clearance restored.`);
         await fetchData(true);
       }
    } catch (err: any) {
      console.error("[USER MGMT] TOGGLE STATUS ERROR:", err);
      toast.error(err.message || "Failed to update operator status.");
    } finally {
      setTogglingUserId(null);
    }
  };

  /* ── Role Assignment ─────────────────────────────────────────────────── */
  const openAssignModal = (user: any) => {
    setSelectedUser(user);
    setSelectedRoleIds(user.roles?.map((r: any) => r.id) || []);
    setIsAssignOpen(true);
  };

const handleSaveRoles = async () => {
     if (!selectedUser) return;
     setIsSavingRoles(true);
     try {
       await updateUser(selectedUser.id, { role_ids: selectedRoleIds });
       toast.success(`Clearance tiers updated for operator [${selectedUser.username}]. ${selectedRoleIds.length} role(s) assigned.`);
       setIsAssignOpen(false);
       await fetchData(true);
     } catch (err: any) {
       toast.error(err.message || "Failed to update role assignments.");
     } finally {
       setIsSavingRoles(false);
     }
   };

  /* ── Create User ─────────────────────────────────────────────────────── */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateErrorMsg("");
    if (!newUsername.trim()) {
      setCreateErrorMsg("Username identifier is required.");
      return;
    }
    if (!newPassword) {
      setCreateErrorMsg("Passcode cipher is required.");
      return;
    }
    if (newPassword.length < 6) {
      setCreateErrorMsg("Passcode cipher must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setCreateErrorMsg("Verification mismatch: Passcode ciphers do not match.");
      return;
    }

    setIsCreating(true);
try {
       await createUser({ username: newUsername.trim(), password: newPassword, role_ids: newRoleIds });
       toast.success(`Operator account [${newUsername.trim()}] provisioned successfully. Welcome to the grid.`);
       setIsCreateOpen(false);
       setNewUsername("");
       setNewPassword("");
       setConfirmPassword("");
       setNewRoleIds([]);
       await fetchData(true);
     } catch (err: any) {
       setCreateErrorMsg(err.message || "Failed to create operator account.");
     }
  };

  /* ── Edit User ───────────────────────────────────────────────────────── */
  const openEditModal = (user: any) => {
    setSelectedUser(user);
    setEditUsername(user.username);
    setEditIsActive(user.is_active);
    setEditErrorMsg("");
    setIsEditOpen(true);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditErrorMsg("");
    if (!editUsername.trim()) {
      setEditErrorMsg("Username identifier cannot be blank.");
      return;
    }

    // Guard: deactivating self or last SuperAdmin
    if (!editIsActive && selectedUser.is_active) {
      if (appUser && selectedUser.id === appUser.id) {
        setEditErrorMsg("Cannot deactivate active session account.");
        return;
      }
      const isSuperAdmin = selectedUser.roles?.some(
        (r: any) => r.name?.toLowerCase() === "superadmin"
      );
      if (isSuperAdmin) {
        const activeSuperAdmins = users.filter(
          (u) =>
            u.is_active &&
            u.roles?.some((r: any) => r.name?.toLowerCase() === "superadmin")
        );
        if (activeSuperAdmins.length <= 1) {
          setEditErrorMsg("At least one active SuperAdmin must remain in the network.");
          return;
        }
      }
    }

    setIsSavingEdit(true);
try {
       await updateUser(selectedUser.id, {
         username: editUsername.trim(),
         is_active: editIsActive,
       });
       toast.success(`Operator profile [${editUsername.trim()}] updated successfully.`);
       setIsEditOpen(false);
       await fetchData(true);
     } catch (err: any) {
       setEditErrorMsg(err.message || "Failed to update operator profile.");
     }
  };

  /* ── Reset Password ──────────────────────────────────────────────────── */
  const openResetModal = (user: any) => {
    setSelectedUser(user);
    setResetPassword("");
    setResetConfirmPassword("");
    setResetErrorMsg("");
    setIsResetOpen(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMsg("");
    if (!resetPassword) {
      setResetErrorMsg("New password cipher is required.");
      return;
    }
    if (resetPassword.length < 6) {
      setResetErrorMsg("Password cipher must be at least 6 characters.");
      return;
    }
    if (resetPassword !== resetConfirmPassword) {
      setResetErrorMsg("Password ciphers do not match. Re-enter to verify.");
      return;
    }

    setIsSavingReset(true);
try {
       await resetUserPassword(selectedUser.id, resetPassword);
       toast.success(`Passkey cipher rewritten for node [${selectedUser.username}]. New credentials active.`);
       setIsResetOpen(false);
     } catch (err: any) {
       setResetErrorMsg(err.message || "Failed to rewrite password cipher.");
     }
  };

  /* ── Details Modal ───────────────────────────────────────────────────── */
  const openDetailModal = (user: any) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  /* ── Role Checkbox ───────────────────────────────────────────────────── */
  const handleRoleCheckboxChange = (roleId: number, isChecked: boolean, isCreate = false) => {
    if (isCreate) {
      setNewRoleIds((prev) =>
        isChecked ? [...prev, roleId] : prev.filter((id) => id !== roleId)
      );
    } else {
      setSelectedRoleIds((prev) =>
        isChecked ? [...prev, roleId] : prev.filter((id) => id !== roleId)
      );
    }
  };

  /* ── Metrics ─────────────────────────────────────────────────────────── */
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.is_active).length;
  const inactiveUsers = totalUsers - activeUsers;
  const totalRolesAssigned = users.reduce((acc, u) => acc + (u.roles?.length || 0), 0);

  /* ── Filtered Data ───────────────────────────────────────────────────── */
  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      u.username?.toLowerCase().includes(term) ||
      u.roles?.some((r: any) => r.name?.toLowerCase().includes(term));
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && u.is_active) ||
      (statusFilter === "inactive" && !u.is_active);
    return matchesSearch && matchesStatus;
  });

  /* ── Table Column Definitions ────────────────────────────────────────── */
  const columns: CyberColumn[] = [
    {
      header: "Avatar",
      accessor: "avatar",
      render: (row) => <CyberAvatar username={row.username} size="sm" isOnline={row.is_active} />,
    },
    {
      header: "Username",
      accessor: "username",
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-primary tracking-wide text-sm">{row.username}</span>
          <div className="text-[10px] text-textSecondary font-mono mt-0.5">ID: {row.id}</div>
        </div>
      ),
    },
    {
      header: "Clearance Level",
      accessor: "roles",
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.roles || []).map((r: any) => {
            const roleVariant: Record<string, "primary" | "secondary" | "success" | "warning" | "danger"> = {
              superadmin: "danger",
              admin: "secondary",
              manager: "primary",
              analyst: "warning",
              viewer: "success",
            };
            const variantKey = r.name?.toLowerCase();
            return (
              <CyberBadge key={r.id} variant={roleVariant[variantKey] || "muted"}>
                {r.name?.toUpperCase()}
              </CyberBadge>
            );
          })}
          {(!row.roles || row.roles.length === 0) && (
              <span className="text-gray-600 text-xs italic font-sans">None</span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "is_active",
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className={`inline-block w-2 h-2 rounded-full ${row.is_active ? "bg-success" : "bg-danger"}`} />
          <CyberBadge variant={row.is_active ? "success" : "danger"}>
            {row.is_active ? "ACTIVE" : "INACTIVE"}
          </CyberBadge>
        </div>
      ),
    },
  ];

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-6">
      {/* ── Cyberpunk Confirm Dialog ── */}
      <CyberConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        confirmVariant={confirmDialog.confirmVariant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />

      {/* ── Page Title ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-sans font-black tracking-wider text-primary uppercase">
            User Management
          </h1>
          <p className="text-muted font-sans text-sm">
            Manage system users, roles, and account status
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-[10px] font-mono text-textSecondary hidden md:block">
              SYNCED: {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={() => fetchData()}
            disabled={isLoadingData}
            title="Refresh user registry"
            className="p-2 rounded-lg border border-accent/20 text-accent/60 hover:text-accent hover:border-accent/40 hover:bg-accent/10 transition disabled:opacity-40"
          >
            <motion.div animate={isLoadingData ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 1, repeat: isLoadingData ? Infinity : 0, ease: "linear" }}>
              <RefreshCw className="w-4 h-4" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* ── DIAGNOSTIC PANEL — only shown on error or initial load failure ── */}
      <AnimatePresence>
        {(fetchError || (isLoadingData && users.length === 0)) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="font-sans text-xs border border-warning/30 bg-card-bg rounded-xl p-4 space-y-1"
          >
            <p className="text-warning font-black tracking-widest uppercase mb-2">System Diagnostic</p>
            <p><span className="text-textSecondary">STATUS:</span> <span className={isLoadingData ? "text-warning" : fetchError ? "text-danger" : "text-success"}>{isLoadingData ? "LOADING..." : fetchError ? "FETCH ERROR" : "LOADED"}</span></p>
            <p><span className="text-textSecondary">Users Loaded:</span> <span className="text-primary">{users.length}</span></p>
            <p><span className="text-textSecondary">Roles Loaded:</span> <span className="text-primary">{roles.length}</span></p>
            {fetchError && <p><span className="text-danger">Last Error: {fetchError}</span></p>}
            <button onClick={() => fetchData()} className="mt-2 px-3 py-1 border border-accent/30 text-accent hover:bg-accent/10 rounded text-[10px] uppercase tracking-widest transition">↻ Retry</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Metrics Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CyberStatCard title="Total Registered Nodes" value={totalUsers} variant="primary" />
        <CyberStatCard title="Active Clearances" value={activeUsers} variant="success" />
        <CyberStatCard title="Suspended Nodes" value={inactiveUsers} variant="danger" />
        <CyberStatCard title="Privileges Mapped" value={totalRolesAssigned} variant="secondary" />
      </div>

      {/* ── Control Bar ── */}
      <CyberCard className="flex flex-col md:flex-row items-center gap-4 justify-between">
        <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-3 flex-1">
          {/* Search */}
          <div className="w-full sm:w-80 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-textSecondary pointer-events-none" />
            <CyberInput
              type="text"
              placeholder="Search by username or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2rem" }}
            />
          </div>
          {/* Status Filter */}
          <div className="w-full sm:w-auto flex gap-1 bg-card-bg p-1 border border-accent/10 rounded-lg">
            {(["all", "active", "inactive"] as const).map((f) => {
              const colors = {
                all: "bg-accent/20 text-accent border-accent/30",
                active: "bg-success/20 text-success border-success/30",
                inactive: "bg-danger/20 text-danger border-danger/30",
              };
              const counts = { all: totalUsers, active: activeUsers, inactive: inactiveUsers };
              return (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 text-xs font-mono tracking-wider transition-all duration-300 rounded border ${statusFilter === f
                    ? colors[f]
                    : "text-text-muted hover:text-textPrimary border-transparent"
                    }`}
                >
                  {f.toUpperCase()}
                  <span className="ml-1.5 opacity-60">({counts[f]})</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="w-full md:w-auto flex justify-end">
          <CyberButton onClick={() => { setCreateErrorMsg(""); setNewUsername(""); setNewPassword(""); setConfirmPassword(""); setNewRoleIds([]); setIsCreateOpen(true); }} variant="primary">
            + Provision Operator
          </CyberButton>
        </div>
      </CyberCard>

      {/* ── Users Table ── */}
      {isLoadingData && users.length === 0 ? (
        <CyberCard>
          <CyberSpinner />
        </CyberCard>
      ) : (
        <CyberTable
          columns={columns}
          data={filteredUsers}
          actions={(row) => (
            <div className="flex flex-wrap items-center gap-1.5 justify-center">
              {/* Details */}
              <button
                onClick={() => openDetailModal(row)}
                title="View operator telemetry"
                className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider font-sans px-2 py-1 bg-card-bg border border-border text-text-muted hover:text-white rounded hover:bg-hover-bg transition"
              >
                <Search className="w-2.5 h-2.5" />
                Info
              </button>
              {/* Edit */}
              <button
                onClick={() => openEditModal(row)}
                title="Edit user"
                className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider font-sans px-2 py-1 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 rounded transition"
              >
                <Edit3 className="w-2.5 h-2.5" />
                Edit
              </button>
              {/* Assign Roles */}
              <button
                onClick={() => openAssignModal(row)}
                title="Manage roles"
                className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider font-sans px-2 py-1 bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary/20 rounded transition"
              >
                <Shield className="w-2.5 h-2.5" />
                Roles
              </button>
              {/* Reset Password */}
              <button
                onClick={() => openResetModal(row)}
                title="Reset password"
                className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider font-sans px-2 py-1 bg-warning/10 border border-warning/30 text-warning hover:bg-warning/20 rounded transition"
              >
                <Key className="w-2.5 h-2.5" />
                Pass
              </button>
              {/* Lock / Unlock */}
              <button
                onClick={() => handleToggleStatus(row)}
                disabled={togglingUserId === row.id}
                title={row.is_active ? "Suspend clearance node" : "Restore clearance node"}
                className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider font-sans px-2 py-1 rounded border transition disabled:opacity-50 ${row.is_active
                  ? "bg-card-bg border-border text-text-muted hover:bg-hover-bg"
                  : "bg-success/10 border-success/30 text-success hover:bg-success/20"
                  }`}
              >
                {row.is_active ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                {togglingUserId === row.id ? "..." : row.is_active ? "Lock" : "Unlock"}
              </button>
              {/* Delete */}
              <button
                onClick={() => handleDelete(row)}
                title="Delete user"
                className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider font-sans px-2 py-1 bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 rounded transition"
              >
                <Trash2 className="w-2.5 h-2.5" />
                Del
              </button>
            </div>
          )}
        />
      )}

      {/* Empty state */}
      {!isLoadingData && filteredUsers.length === 0 && users.length > 0 && (
        <CyberCard>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <UserX className="w-12 h-12 text-textSecondary" />
            <p className="text-sm font-sans text-textSecondary">No results match your search criteria.</p>
            <button
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
              className="text-xs font-sans text-accent hover:underline"
            >
              Clear filters
            </button>
          </div>
        </CyberCard>
      )}

      {/* ════════════════════════════════════
          MODALS
          ════════════════════════════════════ */}

      {/* View Operator Details */}
      <CyberModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Operator Node Telemetry: ${selectedUser?.username}`}
      >
        <div className="space-y-4 font-mono">
          <div className="flex justify-center mb-4">
            <CyberAvatar username={selectedUser?.username || ""} size="lg" isOnline={selectedUser?.is_active} />
          </div>
          <div className="bg-card-bg p-4 rounded-lg border border-accent/20 text-xs space-y-2 text-textPrimary">
            <div className="flex justify-between border-b border-accent/5 pb-2">
              <span className="text-muted">User ID:</span>
              <span className="text-primary font-bold">{selectedUser?.id}</span>
            </div>
            <div className="flex justify-between border-b border-accent/5 pb-2">
              <span className="text-muted">Username:</span>
              <span className="text-primary font-bold">{selectedUser?.username}</span>
            </div>
            <div className="flex justify-between border-b border-accent/5 pb-2">
              <span className="text-muted">Roles:</span>
              <span className="text-primary font-bold text-right max-w-[60%]">
                {selectedUser?.roles?.length > 0
                  ? selectedUser.roles.map((r: any) => r.name?.toUpperCase()).join(", ")
                  : "No Roles Assigned"}
              </span>
            </div>
            <div className="flex justify-between border-b border-accent/5 pb-2">
              <span className="text-muted">Status:</span>
              <span className={selectedUser?.is_active ? "text-success font-bold" : "text-danger font-bold"}>
                {selectedUser?.is_active ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-muted">Created:</span>
              <span className="text-text-muted">
                {selectedUser?.created_at
                  ? new Date(selectedUser.created_at).toLocaleString()
                  : "—"}
              </span>
            </div>
          </div>

          {/* Quick Actions from Detail Modal */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => { setIsDetailOpen(false); openEditModal(selectedUser); }}
              className="flex-1 text-xs font-sans font-bold uppercase tracking-wider px-3 py-2 bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20 rounded-lg transition"
            >
              Edit Profile
            </button>
            <button
              onClick={() => { setIsDetailOpen(false); openResetModal(selectedUser); }}
              className="flex-1 text-xs font-sans font-bold uppercase tracking-wider px-3 py-2 bg-warning/10 border border-warning/30 text-warning hover:bg-warning/20 rounded-lg transition"
            >
              Reset Password
            </button>
            <button
              onClick={() => { setIsDetailOpen(false); openAssignModal(selectedUser); }}
              className="flex-1 text-xs font-sans font-bold uppercase tracking-wider px-3 py-2 bg-secondary/10 border border-secondary/30 text-secondary hover:bg-secondary/20 rounded-lg transition"
            >
              Edit Roles
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <CyberButton variant="secondary" onClick={() => setIsDetailOpen(false)}>
              Close Panel
            </CyberButton>
          </div>
        </div>
      </CyberModal>

      {/* Edit User */}
      <CyberModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Modify Operator: ${selectedUser?.username}`}
      >
        <form onSubmit={handleEditUser} className="space-y-4">
          {editErrorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-danger/10 border border-danger/40 text-danger text-xs rounded-lg font-mono"
            >
              ⚠ {editErrorMsg}
            </motion.div>
          )}
          <div className="space-y-1">
            <label className="text-xs uppercase text-muted tracking-wider font-sans">Username</label>
            <CyberInput
              type="text"
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase text-muted tracking-wider block font-sans">Account Status</label>
            <label className="flex items-center space-x-3 bg-card-bg p-3 rounded-lg border border-accent/10 cursor-pointer hover:border-accent/25 transition">
              <input
                type="checkbox"
                id="editIsActive"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-accent/30 text-primary focus:ring-primary/50 bg-card-bg"
              />
              <div>
                <span className="text-xs font-sans text-text-muted font-bold">Account is Active</span>
                <p className="text-[10px] text-textSecondary font-sans mt-0.5">Uncheck to disable user access</p>
              </div>
            </label>
          </div>

          {/* Show current roles info */}
          {selectedUser?.roles?.length > 0 && (
            <div className="p-2 bg-black/40 rounded-lg border border-accent/10">
              <p className="text-[10px] text-textSecondary font-sans mb-1.5 uppercase tracking-wider">Current Roles</p>
              <div className="flex flex-wrap gap-1">
                {selectedUser.roles.map((r: any) => (
                  <span key={r.id} className="text-[10px] font-sans font-bold px-2 py-0.5 bg-secondary/15 border border-secondary/30 text-secondary rounded uppercase">
                    {r.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-accent/10">
            <CyberButton variant="secondary" onClick={() => setIsEditOpen(false)} type="button">
              Cancel
            </CyberButton>
            <CyberButton type="submit" variant="primary" disabled={isSavingEdit}>
              {isSavingEdit ? "Writing..." : "Write Updates"}
            </CyberButton>
          </div>
        </form>
      </CyberModal>

      {/* Reset Password */}
      <CyberModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        title={`Reset Credentials: ${selectedUser?.username}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          {resetErrorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-danger/10 border border-danger/40 text-danger text-xs rounded-lg font-mono"
            >
              ⚠ {resetErrorMsg}
            </motion.div>
          )}
          <div className="p-3 bg-warning/5 border border-warning/20 rounded-lg">
            <p className="text-[10px] font-sans text-warning/80 uppercase tracking-wider">
              Resetting password for: <span className="font-black text-warning">{selectedUser?.username}</span>
            </p>
            <p className="text-[10px] font-sans text-textSecondary mt-1">New password will take effect immediately.</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase text-muted tracking-wider font-sans">New Password</label>
            <CyberInput
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {resetPassword.length > 0 && resetPassword.length < 6 && (
              <p className="text-[10px] text-danger font-sans">Minimum 6 characters required</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase text-muted tracking-wider font-sans">Confirm Password</label>
            <CyberInput
              type="password"
              value={resetConfirmPassword}
              onChange={(e) => setResetConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {resetConfirmPassword && resetPassword !== resetConfirmPassword && (
              <p className="text-[10px] text-danger font-sans">Passwords do not match</p>
            )}
            {resetConfirmPassword && resetPassword === resetConfirmPassword && resetPassword.length >= 6 && (
              <p className="text-[10px] text-success font-sans">Passwords match</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-accent/10">
            <CyberButton variant="secondary" onClick={() => setIsResetOpen(false)} type="button">
              Cancel
            </CyberButton>
            <CyberButton type="submit" variant="primary" disabled={isSavingReset}>
              {isSavingReset ? "Updating..." : "Reset Password"}
            </CyberButton>
          </div>
        </form>
      </CyberModal>

      {/* Assign Roles */}
      <CyberModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title={`Authorize Access: ${selectedUser?.username}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-secondary/5 border border-secondary/20 rounded-lg">
            <p className="text-[10px] font-sans text-secondary/80 uppercase tracking-wider">
              Managing roles for: <span className="font-black text-secondary">{selectedUser?.username}</span>
            </p>
            <p className="text-[10px] font-sans text-textSecondary mt-1">
              {selectedRoleIds.length} role(s) selected. Changes take effect immediately upon save.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {roles.map((role) => {
              const isSelected = selectedRoleIds.includes(role.id);
              return (
                <label
                  key={role.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected
                    ? "border-secondary/50 bg-secondary/10"
                    : "border-accent/15 bg-card-bg hover:bg-primary/5"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => handleRoleCheckboxChange(role.id, e.target.checked)}
                    className="w-4 h-4 rounded border-accent/30 text-primary focus:ring-primary/50 bg-card-bg"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-primary uppercase tracking-wider">{role.name}</div>
                    {role.description && <div className="text-xs text-muted mt-0.5">{role.description}</div>}
                  </div>
                  {isSelected && <span className="text-secondary text-xs font-sans">✓</span>}
                </label>
              );
            })}
            {roles.length === 0 && (
              <p className="text-xs text-muted font-sans text-center py-4">No roles defined.</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-accent/10">
            <CyberButton variant="secondary" onClick={() => setIsAssignOpen(false)} type="button">
              Cancel
            </CyberButton>
            <CyberButton variant="primary" onClick={handleSaveRoles} disabled={isSavingRoles}>
              {isSavingRoles ? "Saving..." : "Save Roles"}
            </CyberButton>
          </div>
        </div>
      </CyberModal>

      {/* Provision New Operator */}
      <CyberModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision New Operator"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {createErrorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-danger/10 border border-danger/40 text-danger text-xs rounded-lg font-sans"
            >
              {createErrorMsg}
            </motion.div>
          )}
          <div className="space-y-1">
            <label className="text-xs uppercase text-muted tracking-wider font-sans">Username</label>
            <CyberInput
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="e.g. agent_x"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase text-muted tracking-wider font-sans">Password</label>
            <CyberInput
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <p className="text-[10px] font-sans text-textSecondary">Minimum 6 characters required</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs uppercase text-muted tracking-wider font-sans">Confirm Password</label>
            <CyberInput
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-[10px] text-danger font-sans">Passwords do not match</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs uppercase text-muted tracking-wider block font-sans">Initial Roles</label>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2">
              {roles.map((role) => (
                <label
                  key={role.id}
                  className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${newRoleIds.includes(role.id)
                    ? "border-secondary/40 bg-secondary/10"
                    : "border-accent/10 bg-black/30 hover:bg-primary/5"
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={newRoleIds.includes(role.id)}
                    onChange={(e) => handleRoleCheckboxChange(role.id, e.target.checked, true)}
                    className="w-3.5 h-3.5 rounded border-accent/30 text-primary focus:ring-primary/50 bg-card-bg"
                  />
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">{role.name}</span>
                </label>
              ))}
              {roles.length === 0 && (
                <p className="text-xs font-sans text-textSecondary italic">No roles available.</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-accent/10">
            <CyberButton variant="secondary" onClick={() => setIsCreateOpen(false)} type="button">
              Cancel
            </CyberButton>
            <CyberButton type="submit" variant="primary" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Account"}
            </CyberButton>
          </div>
        </form>
      </CyberModal>
    </div>
  );
};

export default UserManagement;
