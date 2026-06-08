import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  getUsers,
  deleteUser,
  createUser,
  updateUser,
  getRoles,
} from "../services/api";
import UserForm from "../components/UserForm";
import RoleSelect from "../components/RoleSelect";

/** SuperAdmin User Management page */
const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);

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
        <h2 className="text-3xl font-bold text-center text-cyan-300 mb-6">User Management</h2>
        <button
          onClick={handleCreate}
          className="mb-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded"
        >
          + Create New User
        </button>
        {showForm && (
          <UserForm roles={roles} onCancel={() => setShowForm(false)} onSubmit={handleSubmit} initial={editUser} />
        )}
        <table className="w-full text-gray-200">
          <thead className="border-b border-cyan-500/30">
            <tr>
              <th className="p-2 text-left">Username</th>
              <th className="p-2 text-left">Roles</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-cyan-500/10">
                <td className="p-2">{u.username}</td>
                <td className="p-2">
                  {u.roles.map((r: any) => r.name).join(", ")}
                </td>
                <td className="p-2 text-center space-x-2">
                  <button onClick={() => handleEdit(u)} className="px-2 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(u.id)} className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded">
                    Delete
                  </button>
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
