import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { Contact, ContactFormData } from "../types/contact";
import { getAllContacts, saveContact, deleteContact } from "../db";
import { useAuthStore } from "./auth";
import { useSyncStore } from "./sync";

interface ContactsState {
  contacts: Contact[];
  loading: boolean;
  searchQuery: string;
  selectedTags: string[];

  // Actions
  loadContacts: () => Promise<void>;
  addContact: (data: ContactFormData) => Promise<Contact>;
  updateContact: (id: string, data: ContactFormData) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;

  // Derived / computed helpers
  getContact: (id: string) => Contact | undefined;
  getFilteredContacts: () => Contact[];
  getAllTags: () => string[];
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  loading: false,
  searchQuery: "",
  selectedTags: [],

  loadContacts: async () => {
    // Guard: prevents duplicate load in React Strict Mode (advanced-init-once)
    if (get().loading) return;
    set({ loading: true });
    try {
      const contacts = await getAllContacts();
      set({ contacts, loading: false });
    } catch (e) {
      console.error("Failed to load contacts", e);
      set({ loading: false });
    }
  },

  addContact: async (data) => {
    const now = new Date().toISOString();
    const contact: Contact = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    await saveContact(contact);
    set((state) => ({ contacts: [...state.contacts, contact] }));
    const userId = useAuthStore.getState().user?.id;
    if (userId) useSyncStore.getState().sync(userId);
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
    await saveContact(updated);
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === id ? updated : c)),
    }));
    const userId = useAuthStore.getState().user?.id;
    if (userId) useSyncStore.getState().sync(userId);
  },

  removeContact: async (id) => {
    await deleteContact(id);
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    }));
    const userId = useAuthStore.getState().user?.id;
    if (userId) useSyncStore.getState().sync(userId);
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

  getContact: (id) => get().contacts.find((c) => c.id === id),

  getFilteredContacts: () => {
    const { contacts, searchQuery, selectedTags } = get();
    let result = [...contacts];

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
    contacts.forEach((c) => c.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, "de"));
  },
}));
