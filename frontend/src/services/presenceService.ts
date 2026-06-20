import { supabase } from "./supabaseClient";

export interface UserPresence {
  user_id: number;
  username: string;
  status: "online" | "idle" | "offline";
  current_page: string | null;
  current_workbook_id: string | null;
  session_start: string;
  last_seen: string;
}

let isTableAvailable: boolean | null = null;

const detectTable = async (): Promise<boolean> => {
  if (isTableAvailable !== null) return isTableAvailable;
  try {
    const { error } = await supabase.from("user_presence").select("count", { count: "exact", head: true });
    isTableAvailable = !error;
    return isTableAvailable;
  } catch {
    isTableAvailable = false;
    return false;
  }
};

/**
 * Upsert user presence to Supabase user_presence table.
 * Falls back to localStorage if table doesn't exist.
 */
export const trackUserPresence = async (
  userId: string | number,
  username: string,
  status: "online" | "idle" | "offline",
  currentPage: string | null,
  currentWorkbookId: string | null
): Promise<void> => {
  const now = new Date().toISOString();
  const numericId = Number(userId);

  if (await detectTable()) {
    try {
      const { error } = await supabase.from("user_presence").upsert({
        user_id: numericId,
        username: username,
        status: status,
        current_page: currentPage,
        current_workbook_id: currentWorkbookId,
        last_seen: now,
      });

      if (error) {
        if (error.code === "PGRST205" || error.message?.includes("relation") || error.message?.includes("Could not find")) {
          isTableAvailable = false;
        } else {
          throw error;
        }
      } else {
        return;
      }
    } catch (err) {
      console.warn("Supabase user_presence upsert failed, falling back to localStorage:", err);
      isTableAvailable = false;
    }
  }

  // LocalStorage Fallback
  try {
    const raw = localStorage.getItem("local_user_presences");
    const presences: Record<string, UserPresence> = raw ? JSON.parse(raw) : {};
    const key = String(userId);
    const existing = presences[key] || {};
    
    presences[key] = {
      user_id: numericId,
      username,
      status,
      current_page: currentPage,
      current_workbook_id: currentWorkbookId,
      session_start: existing.session_start || now,
      last_seen: now,
    };

    localStorage.setItem("local_user_presences", JSON.stringify(presences));
    
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Local storage presence write error:", err);
  }
};

/**
 * Clean up presence record when logging out.
 */
export const clearUserPresence = async (userId: string | number): Promise<void> => {
  const numericId = Number(userId);
  const key = String(userId);

  if (await detectTable()) {
    try {
      await supabase.from("user_presence").delete().eq("user_id", numericId);
    } catch {
      isTableAvailable = false;
    }
  }

  try {
    const raw = localStorage.getItem("local_user_presences");
    if (raw) {
      const presences: Record<string, UserPresence> = JSON.parse(raw);
      delete presences[key];
      localStorage.setItem("local_user_presences", JSON.stringify(presences));
      window.dispatchEvent(new Event("storage"));
    }
  } catch {
    // ignore
  }
};

/**
 * Fetch all presence records.
 */
export const getPresences = async (): Promise<UserPresence[]> => {
  if (await detectTable()) {
    try {
      const { data, error } = await supabase
        .from("user_presence")
        .select("*")
        .order("last_seen", { ascending: false });

      if (error) {
        if (error.code === "PGRST205" || error.message?.includes("relation") || error.message?.includes("Could not find")) {
          isTableAvailable = false;
        } else {
          throw error;
        }
      } else {
        return (data || []) as UserPresence[];
      }
    } catch (err) {
      console.warn("Failed to get database presences, falling back to localStorage:", err);
      isTableAvailable = false;
    }
  }

  // LocalStorage Fallback
  try {
    const raw = localStorage.getItem("local_user_presences");
    if (!raw) return [];
    const presencesMap: Record<string, UserPresence> = JSON.parse(raw);
    
    // Convert to array and filter out expired presences (older than 10 mins)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    return Object.values(presencesMap).filter(
      (p) => new Date(p.last_seen).getTime() > tenMinutesAgo
    );
  } catch {
    return [];
  }
};

/**
 * Subscribe to realtime presence updates.
 * Call triggerUpdate callback whenever changes are observed.
 */
export const subscribeToPresence = (
  triggerUpdate: () => void
): (() => void) => {
  let subscription: any = null;

  (async () => {
    if (await detectTable()) {
      try {
        subscription = supabase
          .channel("user_presence_realtime")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "user_presence" },
            () => {
              triggerUpdate();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Failed to subscribe to realtime, falling back to localStorage events:", err);
      }
    }
  })();

  const handleStorageChange = (e: StorageEvent | Event) => {
    if (!(e instanceof StorageEvent) || e.key === "local_user_presences") {
      triggerUpdate();
    }
  };

  window.addEventListener("storage", handleStorageChange);

  return () => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
    window.removeEventListener("storage", handleStorageChange);
  };
};
