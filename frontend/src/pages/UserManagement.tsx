import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getUsers,
  deleteUser,
  createUser,
  updateUser,
  getRoles,
  deactivateUser,
  activateUser,
} from "../services/api";
import UserForm from "../components/UserForm";
import RoleSelect from "../components/RoleSelect";

/** SuperAdmin User Management page */
const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [search, setSearch] = useState<string>("");

  const fetchData = async () => {
    const [uRes, rRes] = await Promise.all([getUsers(), getRoles()]);
    setUsers(uRes.data);
    setRoles(rRes.data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    await deleteUser(id);
    fetchData();
  };

  const handleActivate = async (id: number) => {
    await activateUser(id);
    fetchData();
  };

  const handleDeactivate = async (id: number) => {
    await deactivateUser(id);
    fetchData();
  };

  const handleEdit = (user: any) => {
    setEditUser(user);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditUser(null);
    setShowForm(true);
  };

  const handleSubmit = async (data: any) => {
    if (editUser) {
      await updateUser(editUser.id, data);
    } else {
      await createUser(data);
    }
    setShowForm(false);
    fetchData();
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[#070B14] to-[#0a0f1a] p-6">
      <motion.div
        className="bg-black/70 backdrop-blur-lg p-8 rounded-lg border border-cyan-500/30 w-full max-w-5xl mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
          <h2 className="text-3xl font-bold text-center text-cyan-300 mb-6">SuperAdmin User Management</h2>
          <div className="flex items-center mb-4 space-x-4">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded"
            >
              + Create New User
            </button>
            <input
              type="text"
              placeholder="Search by username, email or role"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="px-2 py-1 rounded bg-gray-800 text-gray-200 border border-cyan-500/30"
            />
          </div>
        {showForm && (
          <UserForm roles={roles} onCancel={() => setShowForm(false)} onSubmit={handleSubmit} initial={editUser} />
        )}
        <table className="w-full text-gray-200">
          <thead className="border-b border-cyan-500/30">
            <tr>
              <th className="p-2 text-left">Username</th>
              <th className="p-2 text-left">Full Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Created</th>
              <th className="p-2 text-left">Last Login</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter((u) => {
                const term = search.toLowerCase();
                return (
                  u.username.toLowerCase().includes(term) ||
                  (u.email && u.email.toLowerCase().includes(term)) ||
                  (u.roles && u.roles.some((r: any) => r.name.toLowerCase().includes(term)))
                );
              })
              .map((u) => (
                <tr key={u.id} className="border-b border-cyan-500/10 hover:bg-cyan-900/30">
                  <td className="p-2">{u.username}</td>
                  <td className="p-2">{u.full_name || "-"}</td>
                  <td className="p-2">{u.email || "-"}</td>
                  <td className="p-2">
                    {u.roles.map((r: any) => {
                      const colors: Record<string, string> = {
                        SuperAdmin: "bg-red-600",
                        Admin: "bg-purple-600",
                        Manager: "bg-cyan-600",
                        Viewer: "bg-gray-600",
                      };
                      return (
                        <span
                          key={r.id}
                          className={`${colors[r.name] || "bg-gray-500"} text-xs px-2 py-0.5 rounded text-white mr-1`}
                        >
                          {r.name}
                        </span>
                      );
                    })}
                  </td>
                  <td className="p-2">
                    <span className={u.is_active ? "bg-green-600 text-xs px-2 py-0.5 rounded text-white" : "bg-red-600 text-xs px-2 py-0.5 rounded text-white"}>
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-2">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}</td>
                  <td className="p-2">{u.last_login ? new Date(u.last_login).toLocaleString() : "-"}</td>
                  <td className="p-2 text-center space-x-1">
                    <button onClick={() => handleEdit(u)} className="px-1 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs">Edit</button>
                    {u.is_active ? (
                      <button onClick={() => handleDeactivate(u.id)} className="px-1 py-0.5 bg-yellow-600 hover:bg-yellow-500 text-white rounded text-xs">Deactivate</button>
                    ) : (
                      <button onClick={() => handleActivate(u.id)} className="px-1 py-0.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs">Activate</button>
                    )}
                    <button onClick={() => {/* TODO: reset password modal */}} className="px-1 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs">Reset PW</button>
                    <button onClick={() => handleDelete(u.id)} className="px-1 py-0.5 bg-red-700 hover:bg-red-600 text-white rounded text-xs">Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </motion.div>
    </section>
  );
};

export default UserManagement;
