import { supabase } from "./supabaseClient";
import { getUsers } from "./userService";

export interface WorkspaceAssignment {
  id: string;
  user_id: string;
  workbook_id: string;
  sheet_id?: string;
  assigned_by?: string;
  assigned_at?: string;
  can_edit: boolean;
  can_delete: boolean;
  can_export: boolean;
  notes_enabled: boolean;
}

export interface WorkspaceNote {
  id: string;
  user_id: string;
  assignment_id?: string;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export interface AssignableUser {
  id: string;
  username?: string;
  email?: string;
  role?: string;
  status?: string;
}

export const getAssignableUsers = async (): Promise<AssignableUser[]> => {
  try {
    const users = await getUsers();
    return users.map((u: any) => ({
      id: String(u.id),
      username: u.username,
      email: u.username,
      role: u.roles?.[0]?.name || "Viewer",
      status: u.is_active ? "active" : "inactive"
    }));
  } catch {
    const cached = localStorage.getItem("workspace_users_cache");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {}
    }
    return [];
  }
};

export const getWorkspaceAssignments = async (userId: string): Promise<WorkspaceAssignment[]> => {
  const intUserId = parseInt(userId);
  if (isNaN(intUserId)) return [];

  const { data, error } = await supabase
    .from("workspace_assignments")
    .select("*")
    .eq("user_id", intUserId);

  if (error) return [];

  return data || [];
};

export const getAssignedWorkbooks = async (userId: string): Promise<string[]> => {
  const intUserId = parseInt(userId);
  if (isNaN(intUserId)) return [];

  const { data, error } = await supabase
    .from("workspace_assignments")
    .select("workbook_id")
    .eq("user_id", intUserId);

  if (error) return [];

  return [...new Set(data?.map(a => String(a.workbook_id)) || [])];
};

export const getAssignedSheets = async (userId: string, workbookId?: string): Promise<string[]> => {
  const intUserId = parseInt(userId);
  if (isNaN(intUserId)) return [];

  let query = supabase
    .from("workspace_assignments")
    .select("sheet_id")
    .eq("user_id", intUserId)
    .not("sheet_id", "is", null);

  if (workbookId) {
    query = query.eq("workbook_id", parseInt(workbookId));
  }

  const { data, error } = await query;

  if (error) return [];

  return data?.map(s => String(s.sheet_id)) || [];
};

export const assignWorkbook = async (
  userId: string,
  workbookId: string,
  assignedBy: string,
  permissions: {
    can_edit?: boolean;
    can_delete?: boolean;
    can_export?: boolean;
    notes_enabled?: boolean;
    sheet_ids?: string[];
  }
): Promise<WorkspaceAssignment> => {
  const intUserId = parseInt(userId);
  const intWorkbookId = parseInt(workbookId);
  const intAssignedBy = parseInt(assignedBy) || null;

  const payload: any = {
    user_id: intUserId,
    workbook_id: intWorkbookId,
    can_edit: permissions.can_edit ?? true,
    can_delete: permissions.can_delete ?? false,
    can_export: permissions.can_export ?? true,
    notes_enabled: permissions.notes_enabled ?? true,
  };
  if (intAssignedBy) payload.assigned_by = intAssignedBy;

  const { data, error } = await supabase
    .from("workspace_assignments")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return data;
};

export const unassignWorkbook = async (assignmentId: string): Promise<void> => {
  const { error } = await supabase
    .from("workspace_assignments")
    .delete()
    .eq("id", parseInt(assignmentId));

  if (error) throw error;
};

export const createWorkspaceNote = async (
  userId: string,
  assignmentId: string | undefined,
  title: string,
  content: string
): Promise<WorkspaceNote> => {
  const payload: any = {
    user_id: parseInt(userId),
    title,
    content,
  };
  if (assignmentId) payload.assignment_id = parseInt(assignmentId);

  const { data, error } = await supabase
    .from("workspace_notes")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getWorkspaceNotes = async (userId: string): Promise<WorkspaceNote[]> => {
  const intUserId = parseInt(userId);
  if (isNaN(intUserId)) return [];

  try {
    const { data, error } = await supabase
      .from("workspace_notes")
      .select("*")
      .eq("user_id", intUserId)
      .order("updated_at", { ascending: false });

    if (error) return [];
    return data || [];
  } catch {
    return [];
  }
};

export const checkWorkspacePermission = async (
  userId: string,
  workbookId: string,
  permission: "edit" | "delete" | "export" | "notes"
): Promise<boolean> => {
  const intUserId = parseInt(userId);
  const intWorkbookId = parseInt(workbookId);
  if (isNaN(intUserId) || isNaN(intWorkbookId)) return false;

  try {
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", intUserId);

    const { data: roles } = await supabase
      .from("roles")
      .select("name")
      .in("id", (userRoles || []).map((ur: any) => ur.role_id));

    const isSuperAdmin = (roles || []).some((r: any) => r.name === "SuperAdmin");

    if (isSuperAdmin) {
      return true;
    }
  } catch {
    // ignore
  }

  try {
    const { data: assignment } = await supabase
      .from("workspace_assignments")
      .select("can_edit, can_delete, can_export, notes_enabled")
      .eq("user_id", intUserId)
      .eq("workbook_id", intWorkbookId)
      .single();

    if (assignment) {
      const key = permission === "edit" ? "can_edit" :
        permission === "delete" ? "can_delete" :
        permission === "export" ? "can_export" : "notes_enabled";

      return (assignment as any)[key] ?? false;
    }
  } catch {
    // ignore
  }

  return false;
};

export interface RecordNote {
  id: string;
  user_id: string;
  workbook_id?: string;
  sheet_id?: string;
  assignment_id?: string;
  record_id: string;
  is_private: boolean;
  content: string;
  created_at: string;
  updated_at: string;
  users?: {
    username: string;
  };
}

export const getRecordNotes = async (
  sheetId: string,
  recordId: string,
  isPrivate: boolean,
  userId?: string
): Promise<RecordNote[]> => {
  const intSheetId = parseInt(sheetId);
  if (isNaN(intSheetId)) return [];

  let query = supabase
    .from("workspace_notes")
    .select("*, users(username)")
    .eq("sheet_id", intSheetId)
    .eq("record_id", recordId)
    .eq("is_private", isPrivate);

  if (isPrivate && userId) {
    const intUserId = parseInt(userId);
    if (!isNaN(intUserId)) {
      query = query.eq("user_id", intUserId);
    }
  }

  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
};

export const getWorksheetPermissions = async (
  userId: string,
  workbookId: string
): Promise<{ can_edit: boolean; can_delete: boolean }> => {
  const intUserId = parseInt(userId);
  const intWorkbookId = parseInt(workbookId);

  if (isNaN(intUserId) || isNaN(intWorkbookId)) {
    return { can_edit: false, can_delete: false };
  }

  try {
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role_id")
      .eq("user_id", intUserId);

    const { data: roles } = await supabase
      .from("roles")
      .select("name")
      .in("id", (userRoles || []).map((ur: any) => ur.role_id));

    const isSuperAdmin = (roles || []).some((r: any) => r.name === "SuperAdmin");

    if (isSuperAdmin) {
      return { can_edit: true, can_delete: true };
    }
  } catch {
    // ignore
  }

  try {
    const { data: assignment } = await supabase
      .from("workspace_assignments")
      .select("can_edit, can_delete")
      .eq("user_id", intUserId)
      .eq("workbook_id", intWorkbookId)
      .single();

    if (assignment) {
      return {
        can_edit: assignment.can_edit ?? false,
        can_delete: assignment.can_delete ?? false
      };
    }
  } catch {
    // ignore
  }

  return { can_edit: false, can_delete: false };
};

export const createRecordNote = async (payload: {
  user_id: string;
  workbook_id?: string;
  sheet_id: string;
  record_id: string;
  is_private: boolean;
  content: string;
}): Promise<RecordNote | null> => {
  const intUserId = parseInt(payload.user_id);
  const intSheetId = parseInt(payload.sheet_id);
  const intWorkbookId = payload.workbook_id ? parseInt(payload.workbook_id) : null;

  if (isNaN(intUserId) || isNaN(intSheetId)) return null;

  const insertData: any = {
    user_id: intUserId,
    sheet_id: intSheetId,
    record_id: payload.record_id,
    is_private: payload.is_private,
    content: payload.content,
  };

  if (intWorkbookId) {
    insertData.workbook_id = intWorkbookId;
  }

  const { data, error } = await supabase
    .from("workspace_notes")
    .insert(insertData)
    .select("*, users(username)")
    .single();

  if (error) throw error;

  return data;
};

export const updateRecordNote = async (
  noteId: string,
  content: string
): Promise<RecordNote | null> => {
  const intNoteId = parseInt(noteId);
  if (isNaN(intNoteId)) return null;

  const { data, error } = await supabase
    .from("workspace_notes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", intNoteId)
    .select("*, users(username)")
    .single();

  if (error) throw error;

  return data;
};

export const deleteRecordNote = async (noteId: string): Promise<void> => {
  const intNoteId = parseInt(noteId);
  if (isNaN(intNoteId)) return;

  const { error } = await supabase
    .from("workspace_notes")
    .delete()
    .eq("id", intNoteId);

  if (error) throw error;
};