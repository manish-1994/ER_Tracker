import React, { useEffect, useState } from "react";
import { CyberCard } from "../components/ui/CyberCard";
import { CyberBadge } from "../components/ui/CyberBadge";
import { CyberStatCard } from "../components/ui/CyberStatCard";
import { CyberButton } from "../components/ui/CyberButton";
import { CyberInput } from "../components/ui/CyberInput";
import { CyberModal } from "../components/ui/CyberModal";
import { CyberAvatar } from "../components/ui/CyberAvatar";
import { CyberTable, PremiumColumn } from "../components/ui/CyberTable";
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
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isHoldersOpen, setIsHoldersOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);
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
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase().trim())
  );

  const totalRoles = roles.length;
  const uniqueUsersWithRoles = userRoles ? new Set(userRoles.map((ur: any) => ur.user_id)).size : 0;

  const roleCards = filteredRoles.map((role) => {
    const userCount = userRoles?.filter((ur: any) => ur.role_id === role.id).length || 0;
    return { ...role, user_count: userCount };
  });

  const initEmptyMatrix = () => {
    const empty: Record<string, Record<string, boolean>> = {};
    MODULES.forEach((mod) => {
      empty[mod] = { view: false, create: false, edit: false, delete: false };
    });
    setMatrix(empty);
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    if (!roleName.trim()) {
      setModalError("Role name cannot be blank.");
      return;
    }
    try {
      await createRoleDefinition(roleName, roleDesc);
      saveRoleMatrix(roleName, matrix);
      toast.success(`Role "${roleName}" created.`);
      setIsCreateOpen(false);
      setRoleName("");
      setRoleDesc("");
      fetchData();
    } catch (err: any) {
      setModalError(err.message || "Failed to create role.");
    }
  };

  const openEditModal = (role: any) => {
    setSelectedRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description || "");
    setMatrix(getRoleMatrix(role.name));
    setModalError("");
    setIsEditOpen(true);
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    if (!roleName.trim()) {
      setModalError("Role name cannot be blank.");
      return;
    }
    try {
      await updateRoleDefinition(selectedRole.id, roleName, roleDesc);
      saveRoleMatrix(roleName, matrix);
      toast.success(`Role "${roleName}" updated`);
      setIsEditOpen(false);
      fetchData();
    } catch (err: any) {
      setModalError(err.message || "Failed to update role.");
    }
  };

  const handleDeleteRole = async (role: any) => {
    if (role.user_count > 0) {
      toast.error(`Role "${role.name}" is in use. Clear mappings before deleting.`);
      return;
    }
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    try {
      await deleteRoleDefinition(role.id);
      const raw = localStorage.getItem("role_permission_matrices");
      if (raw) {
        const parsed = JSON.parse(raw);
        delete parsed[role.name];
        localStorage.setItem("role_permission_matrices", JSON.stringify(parsed));
      }
      toast.success(`Role "${role.name}" deleted`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete role.");
    }
  };

  const openHoldersModal = (role: any) => {
    setSelectedRole(role);
    setIsHoldersOpen(true);
  };

  const holders = selectedRole
    ? users.filter((u) => u.roles?.some((r: any) => typeof r === "object" ? r.name === selectedRole.name : r === selectedRole.name))
    : [];

  const holdersColumns: PremiumColumn[] = [
    {
      header: "Avatar",
      accessor: "avatar",
      render: (row) => <CyberAvatar username={row.username} size="sm" isOnline={row.is_active} />,
    },
    {
      header: "Username",
      accessor: "username",
      render: (row) => <span>{row.username}</span>,
    },
    {
      header: "Status",
      accessor: "is_active",
      render: (row) => (
        <CyberBadge variant={row.is_active ? "success" : "danger"}>
          {row.is_active ? "Active" : "Inactive"}
        </CyberBadge>
      ),
    },
  ];

  const renderMatrixEditor = () => (
    <div className="mt-4 border border-secondary/20 rounded-lg overflow-hidden bg-white p-4 space-y-3 font-sans text-xs">
      <div className="flex justify-between items-center border-b border-secondary/20 pb-1.5">
        <span className="font-semibold text-textPrimary">Permissions Matrix</span>
        <div className="flex gap-2 text-[10px]">
          <button type="button" onClick={() => {
            const full: any = {};
            MODULES.forEach(m => { full[m] = { view: true, create: true, edit: true, delete: true }; });
            setMatrix(full);
          }} className="text-success hover:underline">Allow All</button>
          <span className="text-secondary">|</span>
          <button type="button" onClick={initEmptyMatrix} className="text-danger hover:underline">Clear All</button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-56">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-secondary/20 text-secondary uppercase text-[9px]">
              <th className="p-2">Module</th>
              <th className="p-2 text-center">View</th>
              <th className="p-2 text-center">Create</th>
              <th className="p-2 text-center">Edit</th>
              <th className="p-2 text-center">Delete</th>
            </tr>
          </thead>
          <tbody>
            {MODULES.map((mod) => (
              <tr key={mod} className="border-b border-secondary/10 hover:bg-accent/5">
                <td className="p-2 text-textPrimary font-semibold text-[10px]">{mod}</td>
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
                        className="w-3.5 h-3.5 text-primary border-secondary rounded focus:ring-primary"
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
      <div>
        <h1 className="text-2xl font-sans font-bold tracking-tight text-textPrimary">
          Security Roles
        </h1>
        <p className="text-secondary font-sans text-sm">
          Manage user access roles and permissions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CyberStatCard title="Total Roles" value={totalRoles} variant="primary" />
        <CyberStatCard title="Users Assigned" value={uniqueUsersWithRoles} variant="secondary" />
      </div>

      <CyberCard className="flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div className="w-full sm:w-72">
          <CyberInput
            type="text"
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-auto">
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
            + Create Role
          </CyberButton>
        </div>
      </CyberCard>

      {isLoading && (
        <div className="p-6 text-center font-sans text-secondary">
          Loading roles...
        </div>
      )}
      {isError && (
        <div className="p-6 bg-danger/10 border border-danger/30 text-danger font-sans text-sm rounded-lg">
          Failed to load roles.
        </div>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roleCards.map((role) => (
            <CyberCard key={role.id} className="flex flex-col justify-between min-h-[240px]">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <CyberBadge variant="primary">{role.name.toUpperCase()}</CyberBadge>
                  <span className="text-xs font-sans text-secondary">ID: {role.id}</span>
                </div>
                <p className="text-sm font-sans text-secondary mb-4">
                  {role.description || "No description set."}
                </p>
              </div>
              <div className="border-t border-secondary/20 pt-3 flex flex-col space-y-3">
                <div className="flex justify-between text-xs font-sans">
                  <span className="text-secondary">Holders</span>
                  <span className={`font-bold px-2 py-0.5 rounded bg-secondary/10 ${role.user_count > 0 ? "text-primary" : "text-secondary"}`}>
                    {role.user_count}
                  </span>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <button type="button" onClick={() => openHoldersModal(role)} className="px-2 py-1 text-[10px] font-semibold text-secondary hover:bg-secondary/10 rounded">
                    Holders
                  </button>
                  <button type="button" onClick={() => openEditModal(role)} className="px-2 py-1 text-[10px] font-semibold text-primary hover:bg-primary/10 rounded">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDeleteRole(role)} className="px-2 py-1 text-[10px] font-semibold text-danger hover:bg-danger/10 rounded">
                    Delete
                  </button>
                </div>
              </div>
            </CyberCard>
          ))}
          {roleCards.length === 0 && (
            <div className="col-span-full p-12 text-center text-secondary border border-dashed border-secondary/20 rounded-lg">
              No roles found.
            </div>
          )}
        </div>
      )}

      <CyberModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Role">
        <form onSubmit={handleCreateRole} className="space-y-4 font-sans">
          {modalError && (
            <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-xs rounded-lg">
              {modalError}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs text-secondary">Role Name</label>
            <CyberInput type="text" value={roleName} onChange={(e) => setRoleName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-secondary">Description</label>
<textarea
               value={roleDesc}
               onChange={(e) => setRoleDesc(e.target.value)}
               placeholder="Description..."
               className="w-full bg-[var(--surface)] text-[var(--text)] border border-secondary rounded-lg px-3 py-2 font-sans text-sm placeholder-secondary focus:outline-none focus:border-primary"
               rows={3}
             />
           </div>
           {renderMatrixEditor()}
           <div className="flex justify-end gap-3 pt-4 border-t border-secondary/20">
             <CyberButton variant="secondary" onClick={() => setIsCreateOpen(false)}>Cancel</CyberButton>
            <CyberButton type="submit" variant="primary">Create</CyberButton>
          </div>
        </form>
      </CyberModal>

      <CyberModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title={`Edit Role: ${selectedRole?.name}`}>
        <form onSubmit={handleEditRole} className="space-y-4 font-sans">
          {modalError && (
            <div className="p-3 bg-danger/10 border border-danger/30 text-danger text-xs rounded-lg">
              {modalError}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs text-secondary">Role Name</label>
            <CyberInput type="text" value={roleName} onChange={(e) => setRoleName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-secondary">Description</label>
<textarea
               value={roleDesc}
               onChange={(e) => setRoleDesc(e.target.value)}
               placeholder="Description..."
               className="w-full bg-[var(--surface)] text-[var(--text)] border border-secondary rounded-lg px-3 py-2 font-sans text-sm placeholder-secondary focus:outline-none focus:border-primary"
               rows={3}
             />
           </div>
           {renderMatrixEditor()}
           <div className="flex justify-end gap-3 pt-4 border-t border-secondary/20">
             <CyberButton variant="secondary" onClick={() => setIsEditOpen(false)}>Cancel</CyberButton>
            <CyberButton type="submit" variant="primary">Save</CyberButton>
          </div>
        </form>
      </CyberModal>

      <CyberModal isOpen={isHoldersOpen} onClose={() => setIsHoldersOpen(false)} title={`Users with role: ${selectedRole?.name}`}>
        <div className="space-y-4 font-sans">
          <p className="text-xs text-secondary">Users assigned to this role.</p>
          <div className="max-h-60 overflow-y-auto">
            {holders.length > 0 ? (
              <CyberTable columns={holdersColumns} data={holders} />
            ) : (
              <div className="p-8 text-center text-xs text-secondary border border-dashed border-secondary/20 rounded-lg">
                No users assigned to this role.
              </div>
            )}
          </div>
          <div className="flex justify-end pt-3">
            <CyberButton variant="secondary" onClick={() => setIsHoldersOpen(false)}>Close</CyberButton>
          </div>
        </div>
      </CyberModal>
    </div>
  );
};

export default RoleManagement;