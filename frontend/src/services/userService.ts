import { supabase } from "./supabaseClient";

type UserId = number | string;
type UserRecord = {
  id: UserId;
  username?: string;
  is_active?: boolean;
  hashed_password?: string;
  [key: string]: any;
};

const normalizeRoleIds = (roleIds?: number[]) =>
  [...new Set((roleIds ?? []).map(Number))].sort((a, b) => a - b);

export const verifyUserRecord = async (userId: UserId, expected: Partial<UserRecord> = {}): Promise<UserRecord> => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, is_active")
    .eq("id", userId)
    .single();

  if (error || !data) throw new Error("Verify user record failed: " + (error?.message || "Not found"));

  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = expectedValue;
    if (actualValue !== undefined && (data as any)[key] !== actualValue) {
      throw new Error(`User record verification failed for ${key}`);
    }
  }

  return data as UserRecord;
};

export const verifyRoleAssignments = async (userId: UserId, expectedRoleIds: number[] = []): Promise<number[]> => {
  const expected = normalizeRoleIds(expectedRoleIds);
  const { data, error } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", userId)
    .order("role_id", { ascending: true });

  if (error) throw error;

  const actual = normalizeRoleIds((data ?? []).map((r: any) => r.role_id));
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error("Role assignment verification failed");
  }

  return actual;
};

export const createUser = async (payload: { username: string; password: string; role_ids?: number[] }) => {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        username: payload.username,
        hashed_password: payload.password,
        is_active: true,
      })
      .select()
      .single();

    if (userError) {
      if ((userError as any).code === '23505') {
        throw new Error('Username already exists. Please choose another username.');
      }
      throw userError;
    }

    if (payload.role_ids && payload.role_ids.length > 0) {
      const normalizedRoleIds = normalizeRoleIds(payload.role_ids);
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert(
          normalizedRoleIds.map((roleId) => ({ user_id: (user as any).id, role_id: roleId })),
        );
      if (roleError) throw roleError;
    }

    return { success: true, user } as any;
  } catch (err) {
    throw err;
  }
};

export const getUsers = async () => {
  const { data: users, error } = await supabase
    .from("users")
    .select("id, username, is_active")
    .order("id", { ascending: true });
  if (error) throw error;

  const { data: userRoles, error: userRolesError } = await supabase
    .from("user_roles")
    .select("user_id, role_id");
  if (userRolesError) throw userRolesError;

  const { data: roleDefs, error: roleDefsError } = await supabase.from("roles").select("id, name");
  if (roleDefsError) throw roleDefsError;

  const roleMap = new Map((roleDefs ?? []).map((r) => [r.id, r]));
  return (users ?? []).map((u) => ({
    ...u,
    roles: (userRoles ?? [])
      .filter((ur) => ur.user_id === u.id)
      .map((ur) => roleMap.get(ur.role_id))
      .filter(Boolean),
  }));
};

export const deleteUser = async (userId: UserId) => {
  const { error: rolesError } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);
  if (rolesError) throw rolesError;

  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  if (error) throw error;

  return { id: userId, deleted: true };
};

export const updateUser = async (userId: UserId, updates: { username?: string; password?: string; is_active?: boolean; role_ids?: number[] }) => {
  const payload: any = {};
  if (updates.username) payload.username = updates.username;
  if (typeof updates.is_active === 'boolean') payload.is_active = updates.is_active;
  if (updates.password) {
    payload.hashed_password = updates.password;
  }

  const { data, error } = await supabase.from('users').update(payload).eq('id', userId).select().single();
  if (error) throw error;

  if (updates.role_ids !== undefined) {
    const normalizedRoleIds = normalizeRoleIds(updates.role_ids);
    const { error: deleteErr } = await supabase.from('user_roles').delete().eq('user_id', userId);
    if (deleteErr) throw deleteErr;

    if (normalizedRoleIds.length > 0) {
      const { error: insertErr } = await supabase.from('user_roles').insert(
        normalizedRoleIds.map((rid) => ({ user_id: userId, role_id: rid })),
      );
      if (insertErr) throw insertErr;
    }
  }

  return await verifyUserRecord(userId, payload);
};

export const assignUserRoles = async (userId: UserId, roleIds: number[] = []): Promise<number[]> => {
  const normalizedRoleIds = normalizeRoleIds(roleIds);

  const { error: deleteErr } = await supabase.from('user_roles').delete().eq('user_id', userId);
  if (deleteErr) throw deleteErr;

  if (normalizedRoleIds.length > 0) {
    const { error: insertErr } = await supabase.from('user_roles').insert(
      normalizedRoleIds.map((rid) => ({ user_id: userId, role_id: rid })),
    );
    if (insertErr) throw insertErr;
  }

  return await verifyRoleAssignments(userId, normalizedRoleIds);
};

export const resetUserPassword = async (userId: UserId, newPassword: string) => {
  if (!newPassword || newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const { error } = await supabase.from('users').update({ hashed_password: newPassword }).eq('id', userId).select().single();
  if (error) throw error;

  return { id: userId, hashed_password: newPassword } as UserRecord;
};

export const activateUser = async (userId: UserId) => {
  const { error } = await supabase
    .from('users')
    .update({ is_active: true })
    .eq('id', userId);
  if (error) throw error;

  return await verifyUserRecord(userId, { is_active: true });
};

export const deactivateUser = async (userId: UserId) => {
  const { error } = await supabase
    .from('users')
    .update({ is_active: false })
    .eq('id', userId);
  if (error) throw error;

  return await verifyUserRecord(userId, { is_active: false });
};

export const assignSystemRole = async (userId: string, role: 'super_admin' | 'admin' | 'user') => {
  const { data, error } = await supabase
    .from('system_roles')
    .upsert({ user_id: userId, role }, { onConflict: 'user_id' })
    .single();
  if (error) throw error;
  return data;
};

export const assignWorkbookRole = async (
  userId: string,
  workbookId: string,
  role: 'owner' | 'editor' | 'viewer'
) => {
  const { data, error } = await supabase
    .from('user_roles')
    .insert({ user_id: userId, workbook_id: workbookId, role })
    .single();
  if (error) throw error;
  return data;
};