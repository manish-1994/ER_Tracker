import { supabase } from "./supabaseClient";
import bcrypt from "bcryptjs";

export interface AppUser {
  id: number;
  username: string;
  roles: string[];
  permissions: string[];
}

export const loadRolesForUser = async (userId: number): Promise<string[]> => {
  const { data: roleData, error: roleError } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId);

  if (roleError || !roleData?.length) {
    return [];
  }

  const roleIds = roleData.map((r) => r.role_id);
  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select("name")
    .in("id", roleIds);

  if (rolesError || !roles) {
    return [];
  }

  return roles.map((r) => r.name as string);
};

export const loadPermissionsForUser = async (userId: number): Promise<string[]> => {
  try {
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", userId);

    if (roleError || !roleData?.length) return [];

    const roleIds = roleData.map((r) => r.role_id);

    const { data: rpData, error: rpError } = await supabase
      .from("role_permissions")
      .select("permission_id")
      .in("role_id", roleIds);

    if (rpError || !rpData?.length) return [];

    const permIds = rpData.map((rp) => rp.permission_id);

    const { data: permData, error: permError } = await supabase
      .from("permissions")
      .select("name")
      .in("id", permIds);

    if (permError || !permData?.length) return [];

    return permData.map((p) => p.name as string);
  } catch {
    return [];
  }
};

export const getCurrentApplicationUser = async (): Promise<AppUser | null> => {
  const stored = localStorage.getItem("appUser");
  if (!stored) return null;

  const parsed = JSON.parse(stored) as { id?: number; username?: string };
  if (!parsed?.id || !parsed?.username) return null;

  const [roles, permissions] = await Promise.all([
    loadRolesForUser(parsed.id),
    loadPermissionsForUser(parsed.id)
  ]);
  return { id: parsed.id, username: parsed.username, roles, permissions };
};

export const loginUser = async (username: string, password: string): Promise<AppUser> => {
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("id, username, hashed_password")
    .eq("username", username)
    .single();

  if (fetchError || !user) {
    throw fetchError ?? new Error("User not found");
  }

  const storedHash = user.hashed_password as string;

  // Support both bcrypt hashes (legacy) and plaintext passwords
  const isValid = storedHash.startsWith("$2")
    ? bcrypt.compareSync(password, storedHash)
    : password === storedHash;

  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const userId = user.id as number;
  const [roles, permissions] = await Promise.all([
    loadRolesForUser(userId),
    loadPermissionsForUser(userId)
  ]);
  const sessionUser: AppUser = { id: userId, username: user.username as string, roles, permissions };
  localStorage.setItem("appUser", JSON.stringify(sessionUser));
  return sessionUser;
};