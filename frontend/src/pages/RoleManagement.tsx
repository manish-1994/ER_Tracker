import React, { useEffect, useState } from "react";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberBadge } from "../components/ui/CyberBadge";
import { CyberStatCard } from "../components/ui/CyberStatCard";
import { CyberButton } from "../components/ui/CyberButton";
import { CyberInput } from "../components/ui/CyberInput";
import { CyberModal } from "../components/ui/CyberModal";
import { CyberAvatar } from "../components/ui/CyberAvatar";
import { CyberTable, CyberColumn } from "../components/ui/CyberTable";
import { useAuth } from "../context/AuthContext";
import { logAudit } from "../services/auditService";
import {
  fetchRoles,
  getRoles as getUserRoles,
  createRoleDefinition,
  updateRoleDefinition,
  deleteRoleDefinition,
  getRoleMatrix,
  saveRoleMatrix,
} from "../services/roleService";
import { getUsers } from "../services/userService";
import { useToast } from "../context/ToastContext";

const MODULES = ["Dashboards", "Workbooks", "Worksheets", "Reports", "Users", "Roles", "Settings"];
const ACTIONS = ["view", "create", "edit", "delete"];

const RoleManagement: React.FC = () => {
  const toast = useToast();
  const { appUser } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Search & Filter state
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHoldersOpen, setIsHoldersOpen] = useState(false);

  // Selected items
  const [selectedRole, setSelectedRole] = useState<any>(null);
  
  // Create / Edit fields
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [modalError, setModalError] = useState("");

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [roleDefs, assignments, allUsers] = await Promise.all([
        fetchRoles(),
        getUserRoles(),
        getUsers(),
      ]);
      setRoles(roleDefs || []);
      setUserRoles(assignments || []);
      setUsers(allUsers || []);
      setIsError(false);
    } catch (err) {
      console.error("ROLE_FETCH_ERROR", err);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtering roles by search term
  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const totalRoles = roles.length;
  const uniqueUsersWithRoles = userRoles ? new Set(userRoles.map((ur: any) => ur.user_id)).size : 0;

  const roleCards = filteredRoles.map((role) => {
    const userCount = userRoles?.filter((ur: any) => ur.role_id === role.id).length || 0;
    return { ...role, user_count: userCount };
  });

  const getRoleTheme = (name: string): "primary" | "secondary" | "success" | "warning" | "danger" => {
    const key = name.toLowerCase();
    if (key.includes("superadmin")) return "danger";
    if (key.includes("admin")) return "secondary";
    if (key.includes("manager")) return "primary";
    if (key.includes("analyst")) return "warning";
    return "success";
  };

  // Initialize Matrix
  const initEmptyMatrix = () => {
    const empty: Record<string, Record<string, boolean>> = {};
    MODULES.forEach((mod) => {
      empty[mod] = { view: false, create: false, edit: false, delete: false };
    });
    setMatrix(empty);
  };

  // Submit Create Role
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    if (!roleName.trim()) {
      setModalError("Role tier identifier cannot be blank.");
      return;
    }

    try {
      const created = await createRoleDefinition(roleName, roleDesc);
      saveRoleMatrix(roleName, matrix);

      // Audit Log
      await logAudit({
        user_id: appUser?.id?.toString() || "0",
        worksheet_id: "0",
        action: "role_assignment",
        new_value: `Created Role Definition: ${roleName}`,
      });

      toast.success(`Security tier definition [${roleName}] created.`);
      setIsCreateOpen(false);
      setRoleName("");
      setRoleDesc("");
      fetchData();
    } catch (err: any) {
      setModalError(err.message || "Failed to create security tier definition.");
    }
  };

  // Open Edit modal
  const openEditModal = (role: any) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description || "");
    setMatrix(getRoleMatrix(role.name));
    setModalError("");
    setIsEditOpen(true);
  };

  // Clone Role
  const handleCloneRole = (role: any) => {
    setRoleName(`${role.name}_Copy`);
    setRoleDesc(`Clone of ${role.name}. ${role.description || ""}`);
    setMatrix(getRoleMatrix(role.name));
    setModalError("");
    setIsCreateOpen(true);
  };

  // Submit Edit Role
  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    if (!roleName.trim()) {
      setModalError("Role tier identifier cannot be blank.");
      return;
    }

    try {
      await updateRoleDefinition(selectedRole.id, roleName, roleDesc);
      saveRoleMatrix(roleName, matrix);

      // Audit Log
      await logAudit({
        user_id: appUser?.id?.toString() || "0",
        worksheet_id: "0",
        action: "role_assignment",
        new_value: `Modified Role Definition: ${roleName}`,
      });

      toast.success(`Clearance tier updates written for [${roleName}]`);
      setIsEditOpen(false);
      setRoleName("");
      setRoleDesc("");
      fetchData();
    } catch (err: any) {
      setModalError(err.message || "Failed to update security tier definition.");
    }
  };

  // Submit Delete Role
  const handleDeleteRole = async (role: any) => {
    if (role.user_count > 0) {
      toast.error(`Clearance [${role.name}] is active. Please clear mappings before deleting.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to completely de-register role definition tier [${role.name}]?`)) return;

    try {
      await deleteRoleDefinition(role.id);
      
      // Clear matrix storage
      const raw = localStorage.getItem("role_permission_matrices");
      if (raw) {
        const parsed = JSON.parse(raw);
        delete parsed[role.name];
        localStorage.setItem("role_permission_matrices", JSON.stringify(parsed));
      }

      // Audit Log
      await logAudit({
        user_id: appUser?.id?.toString() || "0",
        worksheet_id: "0",
        action: "role_assignment",
        old_value: `Deleted Role Definition: ${role.name}`,
      });

      toast.success(`Role definition tier [${role.name}] de-registered.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete role definition.");
    }
  };

  const openHoldersModal = (role: any) => {
    setSelectedRole(role);
    setIsHoldersOpen(true);
  };

  const holders = selectedRole
    ? users.filter((u) => u.roles?.some((r: any) => typeof r === "object" ? r.name === selectedRole.name : r === selectedRole.name))
    : [];

  const holdersColumns: CyberColumn[] = [
    {
      header: "Avatar",
      accessor: "avatar",
      render: (row) => <CyberAvatar username={row.username} size="sm" isOnline={row.is_active} />,
    },
    {
      header: "Operator Identification",
      accessor: "username",
      render: (row) => <span className="font-mono font-bold text-primary">{row.username}</span>,
    },
    {
      header: "Registry Status",
      accessor: "is_active",
      render: (row) => (
        <CyberBadge variant={row.is_active ? "success" : "danger"}>
          {row.is_active ? "ACTIVE" : "INACTIVE"}
        </CyberBadge>
      ),
    },
  ];

  const renderMatrixEditor = () => (
    <div className="mt-4 border border-cyan-500/10 rounded-xl overflow-hidden bg-black/60 p-4 space-y-3 font-mono text-xs">
      <div className="font-black text-primary uppercase tracking-wider border-b border-cyan-500/20 pb-1.5 flex justify-between items-center">
        <span>Security Clearance Matrix</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const full: any = {};
              MODULES.forEach(m => {
                full[m] = { view: true, create: true, edit: true, delete: true };
              });
              setMatrix(full);
            }}
            className="text-[9px] text-[#00FF9D] hover:underline"
          >
            Allow All
          </button>
          <span className="text-slate-600">|</span>
          <button
            type="button"
            onClick={initEmptyMatrix}
            className="text-[9px] text-danger hover:underline"
          >
            Clear All
          </button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-56">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-cyan-500/25 text-slate-500 uppercase text-[9px]">
              <th className="p-2">Module</th>
              <th className="p-2 text-center">View</th>
              <th className="p-2 text-center">Create</th>
              <th className="p-2 text-center">Edit</th>
              <th className="p-2 text-center">Delete</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map((mod) => (
              <tr key={mod} className="border-b border-cyan-500/5 hover:bg-cyan-500/5">
                <td className="p-2 text-text font-bold text-[10px] uppercase truncate max-w-[100px]">{mod}</td>
                {ACTIONS.map((act) => {
                  const checked = matrix[mod]?.[act] || false;
                  return (
                    <td key={act} className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setMatrix(prev => ({
                            ...prev,
                            [mod]: {
                              ...(prev[mod] || { view: false, create: false, edit: false, delete: false }),
                              [act]: !checked
                            }
                          }));
                        }}
                        className="w-3.5 h-3.5 text-primary bg-black border-cyan-500/30 rounded focus:ring-primary focus:ring-1"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-3xl font-mono font-black tracking-wider text-primary uppercase neon-text-primary">
          Security Role Clearances
        </h1>
        <p className="text-muted font-mono text-sm">
          System role registry & node security authority control deck
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CyberStatCard title="Total Configured Tiers" value={totalRoles} variant="primary" />
        <CyberStatCard title="Operators Logged under Tiers" value={uniqueUsersWithRoles} variant="secondary" />
      </div>

      {/* Control Actions Bar */}
      <CyberCard className="flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="w-full sm:w-72">
          <CyberInput
            type="text"
            placeholder="Search security clearance tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto flex justify-end">
          <CyberButton 
            onClick={() => { 
              setRoleName(""); 
              setRoleDesc(""); 
              initEmptyMatrix();
              setModalError(""); 
              setIsCreateOpen(true); 
            }} 
            variant="primary"
          >
            + Create Clearance
          </CyberButton>
        </div>
      </CyberCard>

      {/* Loading / Error Handling */}
      {isLoading && (
        <div className="p-6 text-center font-mono text-muted animate-pulse">
          Retrieving clearance records from core data nodes...
        </div>
      )}
      {isError && (
        <div className="p-6 bg-danger/10 border border-danger/45 text-danger font-mono text-sm rounded-xl">
          NODE SYNCHRONIZATION FAILURE: Failed to query system roles database.
        </div>
      )}

      {/* Grid of Role Cards */}
      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roleCards.map((role) => {
            const variant = getRoleTheme(role.name);
            return (
              <CyberCard 
                key={role.id} 
                variant={variant}
                className="flex flex-col justify-between min-h-[260px] hover:shadow-[0_0_25px_rgba(0,229,255,0.06)] hover:border-cyan-500/35 transition-all duration-300 relative group"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <CyberBadge variant={variant}>
                      {role.name.toUpperCase()}
                    </CyberBadge>
                    <span className="text-xs font-mono text-gray-600">
                      TIER ID: 0{role.id}
                    </span>
                  </div>

                  <p className="text-sm font-mono text-text/80 leading-relaxed mb-6">
                    {role.description || "No classification guidelines set for this authority level."}
                  </p>
                </div>

                <div className="border-t border-cyan-500/10 pt-4 flex flex-col space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted uppercase">Clearance Holders</span>
                    <span className={`text-base font-bold px-2.5 py-0.5 rounded bg-black/60 border border-cyan-500/10 ${
                      role.user_count > 0 ? "text-primary neon-text-primary" : "text-gray-600"
                    }`}>
                      {role.user_count}
                    </span>
                  </div>

                  {/* Card Actions Deck */}
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      onClick={() => openHoldersModal(role)}
                      className="text-[10px] uppercase font-bold tracking-wider font-mono px-2 py-1 bg-slate-900 border border-slate-700 text-slate-300 hover:text-white rounded hover:bg-slate-800 transition-all duration-200"
                    >
                      Holders
                    </button>
                    <button
                      onClick={() => openEditModal(role)}
                      className="text-[10px] uppercase font-bold tracking-wider font-mono px-2 py-1 bg-cyan-950/40 border border-[#00E5FF]/30 text-[#00E5FF] hover:bg-[#00E5FF]/20 rounded transition-all duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleCloneRole(role)}
                      className="text-[10px] uppercase font-bold tracking-wider font-mono px-2 py-1 bg-purple-950/40 border border-[#D500F9]/30 text-[#D500F9] hover:bg-[#D500F9]/20 rounded transition-all duration-200"
                    >
                      Clone
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role)}
                      className="text-[10px] uppercase font-bold tracking-wider font-mono px-2 py-1 bg-rose-950/40 border border-[#FF4D6D]/30 text-[#FF4D6D] hover:bg-[#FF4D6D]/20 rounded transition-all duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </CyberCard>
            );
          })}
          {roleCards.length === 0 && (
            <div className="col-span-full p-12 text-center text-muted border border-dashed border-cyan-500/20 rounded-xl font-mono text-sm">
              No matching clearance tiers discovered in the local database.
            </div>
          )}
        </div>
      )}

      {/* Create Role Modal */}
      <CyberModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision Role Clearance"
      >
        <form onSubmit={handleCreateRole} className="space-y-4 font-mono">
          {modalError && (
            <div className="p-3 bg-danger/10 border border-danger/40 text-danger text-xs rounded-lg">
              [WARNING]: {modalError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs uppercase text-muted tracking-wider">Clearance Identifier</label>
            <CyberInput
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g. AuditOfficer"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase text-muted tracking-wider">Classification Guidelines / Description</label>
            <textarea
              value={roleDesc}
              onChange={(e) => setRoleDesc(e.target.value)}
              placeholder="Provide scope of security access..."
              className="w-full bg-[#0a0f1d]/85 text-text border border-cyan-500/30 rounded-lg px-4 py-2.5 font-mono text-sm placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(0,229,255,0.25)] focus:bg-[#070b14]/95 min-h-[80px]"
            />
          </div>

          {renderMatrixEditor()}

          <div className="flex justify-end gap-3 pt-4 border-t border-cyan-500/10">
            <CyberButton variant="secondary" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </CyberButton>
            <CyberButton type="submit" variant="primary">
              Initialize Clearance
            </CyberButton>
          </div>
        </form>
      </CyberModal>

      {/* Edit Role Modal */}
      <CyberModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Modify Role Clearance: ${selectedRole?.name}`}
      >
        <form onSubmit={handleEditRole} className="space-y-4 font-mono">
          {modalError && (
            <div className="p-3 bg-danger/10 border border-danger/40 text-danger text-xs rounded-lg">
              [WARNING]: {modalError}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs uppercase text-muted tracking-wider">Clearance Identifier</label>
            <CyberInput
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Enter name"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs uppercase text-muted tracking-wider">Classification Guidelines / Description</label>
            <textarea
              value={roleDesc}
              onChange={(e) => setRoleDesc(e.target.value)}
              placeholder="Scope of security access..."
              className="w-full bg-[#0a0f1d]/85 text-text border border-cyan-500/30 rounded-lg px-4 py-2.5 font-mono text-sm placeholder-gray-500 transition-all duration-300 focus:outline-none focus:border-primary focus:shadow-[0_0_15px_rgba(0,229,255,0.25)] focus:bg-[#070b14]/95 min-h-[80px]"
            />
          </div>

          {renderMatrixEditor()}

          <div className="flex justify-end gap-3 pt-4 border-t border-cyan-500/10">
            <CyberButton variant="secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </CyberButton>
            <CyberButton type="submit" variant="primary">
              Write Updates
            </CyberButton>
          </div>
        </form>
      </CyberModal>

      {/* View Clearance Holders Modal */}
      <CyberModal
        isOpen={isHoldersOpen}
        onClose={() => setIsHoldersOpen(false)}
        title={`Operators Cleared for Tier: ${selectedRole?.name.toUpperCase()}`}
      >
        <div className="space-y-4 font-mono">
          <p className="text-xs text-muted">
            Registry details of operator nodes holds this security clearance level.
          </p>

          <div className="max-h-60 overflow-y-auto">
            {holders.length > 0 ? (
              <CyberTable
                columns={holdersColumns}
                data={holders}
              />
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-cyan-500/10 rounded-lg bg-black/30">
                No active operator nodes cleared for this system tier level.
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3">
            <CyberButton variant="secondary" onClick={() => setIsHoldersOpen(false)}>
              Close list
            </CyberButton>
          </div>
        </div>
      </CyberModal>
    </div>
  );
};

export default RoleManagement;
