import React, { useState, useEffect } from "react";
import RoleSelect from "./RoleSelect";

/** Simple form for creating or editing a user */
const UserForm = ({ initial, roles, onSubmit, onCancel }: any) => {
  const [username, setUsername] = useState(initial?.username || "");
  const [password, setPassword] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<number[]>(initial?.roles?.map((r: any) => r.id) || []);

  useEffect(() => {
    if (initial) {
      setUsername(initial.username);
      setSelectedRoles(initial.roles?.map((r: any) => r.id) || []);
    }
  }, [initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { username };
    if (password) data.password = password;
    data.role_ids = selectedRoles;
    onSubmit(data);
  };

  return (
    <form className="space-y-4 mb-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
        <input className="w-full px-3 py-2 bg-gray-800 text-gray-100 rounded" value={username} onChange={e => setUsername(e.target.value)} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Password {initial ? '(leave blank to keep)' : ''}</label>
        <input type="password" className="w-full px-3 py-2 bg-gray-800 text-gray-100 rounded" value={password} onChange={e => setPassword(e.target.value)} placeholder={initial ? 'unchanged' : ''} />
      </div>
      <RoleSelect roles={roles} selected={selectedRoles} setSelected={setSelectedRoles} />
      <div className="flex space-x-2">
        <button type="submit" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded">Cancel</button>
      </div>
    </form>
  );
};

export default UserForm;
