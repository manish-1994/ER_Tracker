import React from "react";

/** Multi‑select dropdown for assigning roles to a user */
const RoleSelect = ({ roles, selected, setSelected }: any) => {
  const toggle = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((sid: number) => sid !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">Roles</label>
      <div className="grid grid-cols-2 gap-2">
        {roles.map((role: any) => (
          <label key={role.id} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selected.includes(role.id)}
              onChange={() => toggle(role.id)}
              className="form-checkbox h-4 w-4 text-cyan-600"
            />
            <span className="text-gray-200">{role.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default RoleSelect;
