import { supabase } from "./supabaseClient";

export interface UserPresence {
  user_id: number;
  username: string;
  status: "online" | "idle" | "offline";
  current_page: string | null;
  current_workbook_id: number | null;
  session_start: string;
  last_seen: string;
}

// Memory cache to avoid redundant localStorage parsing
let isTableAvailable = true;

/**
 * Upsert user presence to Supabase user_presence table.
 * Falls back to localStorage if table doesn't exist.
 */
export const trackUserPresence = async (
  userId: number,
  username: string,
  status: "online" | "idle" | "offline",
  currentPage: string | null,
  currentWorkbookId: number | null
): Promise<void> => {
  const now = new Date().toISOString();

  if (isTableAvailable) {
    try {
      const { error } = await supabase.from("user_presence").upsert({
        user_id: userId,
        username: username,
        status: status,
        current_page: currentPage,
        current_workbook_id: currentWorkbookId,
        last_seen: now,
      });

      if (error) {
        // Table not found code (PGRST205 or similar)
        if (error.code === "PGRST205" || error.message?.includes("relation") || error.message?.includes("Could not find")) {
          isTableAvailable = false;
        } else {
          throw error;
        }
      } else {
        return; // Success
      }
    } catch (err) {
      console.warn("Supabase user_presence upsert failed, falling back to localStorage:", err);
      isTableAvailable = false;
    }
  }

  // LocalStorage Fallback
  try {
    const raw = localStorage.getItem("local_user_presences");
    const presences: Record<number, UserPresence> = raw ? JSON.parse(raw) : {};
    
    const existing = presences[userId] || {};
    
    presences[userId] = {
      user_id: userId,
      username,
      status,
      current_page: currentPage,
      current_workbook_id: currentWorkbookId,
      session_start: existing.session_start || now,
      last_seen: now,
    };

    localStorage.setItem("local_user_presences", JSON.stringify(presences));
    
    // Dispatch storage event manually for same-tab listeners
    window.dispatchEvent(new Event("storage"));
  } catch (err) {
    console.error("Local storage presence write error:", err);
  }
};

/**
 * Clean up presence record when logging out.
 */
export const clearUserPresence = async (userId: number): Promise<void> => {
  try {
    await supabase.from("user_presence").delete().eq("user_id", userId);
  } catch {
    // ignore
  }

  try {
    const raw = localStorage.getItem("local_user_presences");
    if (raw) {
      const presences: Record<number, UserPresence> = JSON.parse(raw);
      delete presences[userId];
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
  if (isTableAvailable) {
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
    const presencesMap: Record<number, UserPresence> = JSON.parse(raw);
    
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

  if (isTableAvailable) {
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

  // LocalStorage Storage Listener fallback (syncs tabs)
  const handleStorageChange = (e: StorageEvent | Event) => {
    // If it's a real StorageEvent, check key; if custom dispatch, trigger update
    if (!(e instanceof StorageEvent) || e.key === "local_user_presences") {
      triggerUpdate();
    }
  };

  window.addEventListener("storage", handleStorageChange);

  // Return unsubscribe cleanup function
  return () => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
    window.removeEventListener("storage", handleStorageChange);
  };
};
