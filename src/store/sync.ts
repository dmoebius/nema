import { create } from "zustand";
import { Capacitor } from "@capacitor/core";
import { syncAll } from "../sync/supabaseSync";
import { getActiveContacts, saveContact } from "../db";
import { syncWithDeviceContacts } from "../sync/deviceSync";
import { useContactsStore } from "./contacts";

type SyncStatus = "idle" | "syncing" | "error" | "offline";

interface SyncState {
  status: SyncStatus;
  lastSyncAt: string | null;
  error: string | null;
  hasError: boolean;

  sync: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  status: "idle",
  lastSyncAt: null,
  error: null,
  hasError: false,

  sync: async (userId: string) => {
    if (get().status === "syncing") return;

    if (!navigator.onLine) {
      set({ status: "offline" });
      return;
    }

    set({ status: "syncing", error: null, hasError: false });
    try {
      await syncAll(userId);
      // After Supabase sync, also sync with device contacts (native only)
      if (Capacitor.isNativePlatform()) {
        const activeContacts = await getActiveContacts();
        const updated = await syncWithDeviceContacts(activeContacts);
        for (const c of updated) {
          await saveContact(c);
        }
      }
      set({ status: "idle", lastSyncAt: new Date().toISOString() });
    } catch {
      // Do not expose error details to UI
      set({ status: "error", error: "Sync fehlgeschlagen.", hasError: true });
    } finally {
      // Always reload from IndexedDB after sync attempt (success or failure)
      await useContactsStore.getState().loadContacts();
    }
  },

  clearError: () => set({ error: null, hasError: false }),
}));
