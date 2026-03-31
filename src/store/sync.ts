import { create } from "zustand";
import { syncAll } from "../sync/supabaseSync";

type SyncStatus = "idle" | "syncing" | "error" | "offline";

interface SyncState {
  status: SyncStatus;
  lastSyncAt: string | null;
  error: string | null;

  sync: (userId: string) => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: "idle",
  lastSyncAt: null,
  error: null,

  sync: async (userId: string) => {
    if (get().status === "syncing") return;

    if (!navigator.onLine) {
      set({ status: "offline" });
      return;
    }

    set({ status: "syncing", error: null });
    try {
      await syncAll(userId);
      set({ status: "idle", lastSyncAt: new Date().toISOString() });
    } catch {
      // Do not expose error details to UI
      set({ status: "error", error: "Sync fehlgeschlagen." });
    }
  },
}));
