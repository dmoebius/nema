import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { Capacitor } from "@capacitor/core";
import type { Contact, ContactFormData } from "../types/contact";
import {
  getAllContacts,
  getActiveContacts,
  saveContact as saveContactToDB,
  deleteContact,
  softDeleteContact,
  deleteSyncBase,
} from "../db";
import { useAuthStore } from "./auth";
import { useSyncStore } from "./sync";
import {
  removeContactFromSupabase,
  hardDeleteContactFromSupabase,
  pushContact,
} from "../sync/supabaseSync";
import { Contacts } from "@capacitor-community/contacts";
import { syncWithDeviceContacts } from "../sync/deviceSync";
import { toTimestamped } from "../sync/merge";

interface ContactsState {
  contacts: Contact[];
  loading: boolean;
  hasError: boolean;
  searchQuery: string;
  selectedTags: string[];
  showDeleted: boolean;

  // Actions
  loadContacts: () => Promise<void>;
  addContact: (data: ContactFormData, id?: string) => Promise<Contact>;
  updateContact: (id: string, data: ContactFormData) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  restoreContact: (id: string) => Promise<void>;
  permanentlyDeleteContact: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  setShowDeleted: (v: boolean) => void;

  // Derived / computed helpers
  getContact: (id: string) => Contact | undefined;
  getFilteredContacts: () => Contact[];
  getAllTags: () => string[];
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  loading: false,
  hasError: false,
  searchQuery: "",
  selectedTags: [],
  showDeleted: false,

  loadContacts: async () => {
    set({ loading: true, hasError: false });
    try {
      // Load ALL contacts (active + deleted) — callers filter via getFilteredContacts
      const contacts = await getAllContacts();
      set({ contacts, loading: false });
    } catch {
      set({ loading: false, hasError: true });
    }
  },

  addContact: async (data, id?) => {
    const now = new Date().toISOString();
    const contact: Contact = {
      ...data,
      id: id ?? uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await saveContactToDB(contact);
    set((state) => ({ contacts: [...state.contacts, contact] }));
    const userId = useAuthStore.getState().user?.id;
    if (userId) await useSyncStore.getState().sync(userId);
    // Device sync after add
    if (Capacitor.isNativePlatform()) await runDeviceSync();
    return contact;
  },

  updateContact: async (id, data) => {
    const existing = get().contacts.find((c) => c.id === id);
    if (!existing) return;
    const updated: Contact = {
      ...existing,
      ...data,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await saveContactToDB(updated);
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === id ? updated : c)),
    }));
    const userId = useAuthStore.getState().user?.id;
    if (userId) await useSyncStore.getState().sync(userId);
    // Device sync after update
    if (Capacitor.isNativePlatform()) await runDeviceSync();
  },

  removeContact: async (id) => {
    // Soft-delete: set deletedAt, replicate to Supabase as soft-delete UPDATE
    await softDeleteContact(id);
    const userId = useAuthStore.getState().user?.id;
    if (userId) await removeContactFromSupabase(id);
    // Update in-memory: mark as deleted
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, deletedAt: new Date().toISOString() } : c,
      ),
    }));
    // Device sync: soft-deleted contacts are skipped automatically
    if (Capacitor.isNativePlatform()) await runDeviceSync();
  },

  restoreContact: async (id) => {
    const existing = get().contacts.find((c) => c.id === id);
    if (!existing) return;
    const restored: Contact = {
      ...existing,
      deletedAt: undefined,
      updatedAt: new Date().toISOString(),
    };
    await saveContactToDB(restored);
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      await pushContact(toTimestamped(restored), userId);
    }
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === id ? restored : c)),
    }));
  },

  permanentlyDeleteContact: async (id) => {
    const existing = get().contacts.find((c) => c.id === id);
    // Physical delete from IndexedDB
    await deleteContact(id);
    await deleteSyncBase(id);
    // Hard delete from Supabase
    const userId = useAuthStore.getState().user?.id;
    if (userId) await hardDeleteContactFromSupabase(id);
    // Remove from device address book if linked
    if (existing?.deviceContactId && Capacitor.isNativePlatform()) {
      try {
        await Contacts.deleteContact({ contactId: existing.deviceContactId });
      } catch {
        // Device deletion is best-effort; don't fail the whole operation
      }
    }
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    }));
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSelectedTags: (tags) => set({ selectedTags: tags }),

  toggleTag: (tag) => {
    const current = get().selectedTags;
    if (current.includes(tag)) {
      set({ selectedTags: current.filter((t) => t !== tag) });
    } else {
      set({ selectedTags: [...current, tag] });
    }
  },

  setShowDeleted: (v) => set({ showDeleted: v }),

  getContact: (id) => get().contacts.find((c) => c.id === id),

  getFilteredContacts: () => {
    const { contacts, searchQuery, selectedTags, showDeleted } = get();

    if (showDeleted) {
      // Deleted view: only soft-deleted contacts, no search/tag filters
      return contacts
        .filter((c) => !!c.deletedAt)
        .sort((a, b) => {
          const aName = `${a.lastName} ${a.firstName}`.toLowerCase();
          const bName = `${b.lastName} ${b.firstName}`.toLowerCase();
          return aName.localeCompare(bName, "de");
        });
    }

    // Active view: only non-deleted contacts
    let result = contacts.filter((c) => !c.deletedAt);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.firstName.toLowerCase().includes(q) ||
          c.lastName.toLowerCase().includes(q) ||
          c.company?.toLowerCase().includes(q) ||
          c.phones.some((p) => p.number.includes(q)) ||
          c.emails.some((e) => e.address.toLowerCase().includes(q)) ||
          c.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (selectedTags.length > 0) {
      // js-set-map-lookups: Set for O(1) lookup; contact.tags array order is preserved
      result = result.filter((c) => {
        const tagSet = new Set(c.tags);
        return selectedTags.every((tag) => tagSet.has(tag));
      });
    }

    return result.sort((a, b) => {
      const aName = `${a.lastName} ${a.firstName}`.toLowerCase();
      const bName = `${b.lastName} ${b.firstName}`.toLowerCase();
      return aName.localeCompare(bName, "de");
    });
  },

  getAllTags: () => {
    const { contacts } = get();
    const tagSet = new Set<string>();
    // Only include tags from active (non-deleted) contacts
    contacts
      .filter((c) => !c.deletedAt)
      .forEach((c) => c.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, "de"));
  },
}));

// Internal helper: run device sync with active contacts, persist results to IndexedDB
async function runDeviceSync(): Promise<void> {
  const activeContacts = await getActiveContacts();
  const updated = await syncWithDeviceContacts(activeContacts);
  for (const c of updated) {
    await saveContactToDB(c);
  }
  await useContactsStore.getState().loadContacts();
}
