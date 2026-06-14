import { supabase } from "./supabaseClient";


// Types for the tables (or fallback simple definitions)
export type Role = {
  id: number;
  name: string;
  description: string | null;
};

export type UserRole = {
  user_id: string;
  role_id: number;
};

/** Fetch all role definitions */
export const fetchRoles = async (): Promise<Role[]> => {
  const { data, error } = await supabase.from("roles").select("*").order("id", { ascending: true });
  if (error) {
    console.error("ROLES FETCH FAILED:", error);
    throw error;
  }
  return data as Role[];
};

/** Get all role assignments (system‑wide) */
export const getRoles = async (): Promise<UserRole[]> => {
  const { data, error } = await supabase.from("user_roles").select("*");
  if (error) throw error;
  return data as UserRole[];
};

/** Assign a role to a user (system‑wide) */
export const addRole = async (userId: string, roleId: number): Promise<UserRole> => {
  const { data, error } = await supabase
    .from("user_roles")
    .insert({ user_id: userId, role_id: roleId })
    .select()
    .single();
  if (error) throw error;
  
  return data as UserRole;
};

/** Remove a role assignment */
export const removeRole = async (userId: string, roleId: number): Promise<void> => {
  const { error } = await supabase
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role_id", roleId);
  if (error) throw error;
  
};

/** Create a role definition */
export const createRoleDefinition = async (name: string, description: string): Promise<Role> => {
  const { data, error } = await supabase
    .from("roles")
    .insert({ name, description })
    .select()
    .single();
  if (error) throw error;
  
  return data as Role;
};

/** Update a role definition */
export const updateRoleDefinition = async (roleId: number, name: string, description: string): Promise<Role> => {
  const { data, error } = await supabase
    .from("roles")
    .update({ name, description })
    .eq("id", roleId)
    .select()
    .single();
  if (error) throw error;
  
  return data as Role;
};

/** Delete a role definition */
export const deleteRoleDefinition = async (roleId: number): Promise<void> => {
  const { error } = await supabase
    .from("roles")
    .delete()
    .eq("id", roleId);
  if (error) throw error;
  
};

/** Get a user's role for a specific worksheet (via workbook mapping) */
export const getUserRole = async (worksheetId: string, userId: string): Promise<{ role: string }> => {
  try {
    const uId = parseInt(userId);
    if (isNaN(uId)) return { role: "Viewer" };

    const { data, error } = await supabase
      .from("user_roles")
      .select("role_id, roles(name)")
      .eq("user_id", uId)
      .single();
      
    if (error || !data) {
      return { role: "Viewer" };
    }
    
    const roleName = (data.roles as any)?.name || "Viewer";
    return { role: roleName };
  } catch (err) {
    return { role: "Viewer" };
  }
};

export const DEFAULT_MATRIX: Record<string, Record<string, Record<string, boolean>>> = {
  "SuperAdmin": {
    "Dashboards": { "view": true, "create": true, "edit": true, "delete": true },
    "Workbooks": { "view": true, "create": true, "edit": true, "delete": true },
    "Worksheets": { "view": true, "create": true, "edit": true, "delete": true },
    "Reports": { "view": true, "create": true, "edit": true, "delete": true },
    "Users": { "view": true, "create": true, "edit": true, "delete": true },
    "Roles": { "view": true, "create": true, "edit": true, "delete": true },
    "Settings": { "view": true, "create": true, "edit": true, "delete": true }
  },
  "Admin": {
    "Dashboards": { "view": true, "create": true, "edit": true, "delete": true },
    "Workbooks": { "view": true, "create": true, "edit": true, "delete": true },
    "Worksheets": { "view": true, "create": true, "edit": true, "delete": true },
    "Reports": { "view": true, "create": false, "edit": false, "delete": false },
    "Users": { "view": true, "create": true, "edit": true, "delete": true },
    "Roles": { "view": true, "create": false, "edit": false, "delete": false },
    "Settings": { "view": true, "create": true, "edit": true, "delete": true }
  },
  "Manager": {
    "Dashboards": { "view": true, "create": true, "edit": true, "delete": true },
    "Workbooks": { "view": true, "create": true, "edit": true, "delete": false },
    "Worksheets": { "view": true, "create": true, "edit": true, "delete": false },
    "Reports": { "view": true, "create": true, "edit": true, "delete": false },
    "Users": { "view": false, "create": false, "edit": false, "delete": false },
    "Roles": { "view": false, "create": false, "edit": false, "delete": false },
    "Settings": { "view": false, "create": false, "edit": false, "delete": false }
  },
  "Analyst": {
    "Dashboards": { "view": true, "create": false, "edit": false, "delete": false },
    "Workbooks": { "view": true, "create": false, "edit": false, "delete": false },
    "Worksheets": { "view": true, "create": false, "edit": false, "delete": false },
    "Reports": { "view": false, "create": false, "edit": false, "delete": false },
    "Users": { "view": false, "create": false, "edit": false, "delete": false },
    "Roles": { "view": false, "create": false, "edit": false, "delete": false },
    "Settings": { "view": false, "create": false, "edit": false, "delete": false }
  },
  "Viewer": {
    "Dashboards": { "view": true, "create": false, "edit": false, "delete": false },
    "Workbooks": { "view": false, "create": false, "edit": false, "delete": false },
    "Worksheets": { "view": false, "create": false, "edit": false, "delete": false },
    "Reports": { "view": false, "create": false, "edit": false, "delete": false },
    "Users": { "view": false, "create": false, "edit": false, "delete": false },
    "Roles": { "view": false, "create": false, "edit": false, "delete": false },
    "Settings": { "view": false, "create": false, "edit": false, "delete": false }
  }
};

export const checkPermission = (userRoles: string[], module: string, action: string): boolean => {
  if (userRoles.some(r => r.toLowerCase() === "superadmin")) return true;
  
  const raw = localStorage.getItem("role_permission_matrices");
  let matrices = DEFAULT_MATRIX;
  if (raw) {
    try {
      matrices = { ...DEFAULT_MATRIX, ...JSON.parse(raw) };
    } catch (e) {
      // ignore
    }
  }

  return userRoles.some(role => {
    const roleMatrix = matrices[role] || {};
    return roleMatrix[module]?.[action] === true;
  });
};

export const getRoleMatrix = (roleName: string): Record<string, Record<string, boolean>> => {
  const raw = localStorage.getItem("role_permission_matrices");
  let matrices = DEFAULT_MATRIX;
  if (raw) {
    try {
      matrices = { ...DEFAULT_MATRIX, ...JSON.parse(raw) };
    } catch (e) {
      // ignore
    }
  }
  return matrices[roleName] || {
    "Dashboards": { "view": false, "create": false, "edit": false, "delete": false },
    "Workbooks": { "view": false, "create": false, "edit": false, "delete": false },
    "Worksheets": { "view": false, "create": false, "edit": false, "delete": false },
    "Reports": { "view": false, "create": false, "edit": false, "delete": false },
    "Users": { "view": false, "create": false, "edit": false, "delete": false },
    "Roles": { "view": false, "create": false, "edit": false, "delete": false },
    "Settings": { "view": false, "create": false, "edit": false, "delete": false }
  };
};

export const saveRoleMatrix = (roleName: string, matrix: Record<string, Record<string, boolean>>): void => {
  const raw = localStorage.getItem("role_permission_matrices");
  const matrices = raw ? JSON.parse(raw) : {};
  matrices[roleName] = matrix;
  localStorage.setItem("role_permission_matrices", JSON.stringify(matrices));
};

