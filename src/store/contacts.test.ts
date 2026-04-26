import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Contact } from "../types/contact";

// Mock all dependencies before importing the store
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));

vi.mock("@capacitor-community/contacts", () => ({
  Contacts: { deleteContact: vi.fn() },
}));

vi.mock("../db", () => ({
  getAllContacts: vi.fn(),
  getActiveContacts: vi.fn(),
  saveContact: vi.fn(),
  deleteContact: vi.fn(),
  softDeleteContact: vi.fn(),
  deleteSyncBase: vi.fn(),
}));

vi.mock("../sync/supabaseSync", () => ({
  removeContactFromSupabase: vi.fn(),
  hardDeleteContactFromSupabase: vi.fn(),
  pushContact: vi.fn(),
}));

vi.mock("../sync/deviceSync", () => ({
  syncWithDeviceContacts: vi.fn(async (contacts: Contact[]) => contacts),
}));

vi.mock("./auth", () => ({
  useAuthStore: { getState: vi.fn(() => ({ user: { id: "user-1" } })) },
}));

vi.mock("./sync", () => ({
  useSyncStore: { getState: vi.fn(() => ({ sync: vi.fn() })) },
}));

vi.mock("../sync/merge", () => ({
  toTimestamped: vi.fn((c: Contact) => ({ ...c, fieldTimestamps: {} })),
}));

import * as db from "../db";
import * as supabaseSync from "../sync/supabaseSync";
import { useContactsStore } from "./contacts";

const mockDb = vi.mocked(db);
const mockSupabase = vi.mocked(supabaseSync);

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "c1",
    firstName: "Max",
    lastName: "Mustermann",
    phones: [],
    emails: [],
    addresses: [],
    tags: [],
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("useContactsStore — soft-delete, restore, permanentlyDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    useContactsStore.setState({
      contacts: [],
      loading: false,
      hasError: false,
      searchQuery: "",
      selectedTags: [],
      showDeleted: false,
    });
  });

  // ── loadContacts ────────────────────────────────────────────────────────────

  it("loadContacts loads ALL contacts including soft-deleted", async () => {
    const active = makeContact({ id: "a1" });
    const deleted = makeContact({ id: "d1", deletedAt: "2024-06-01T00:00:00Z" });
    mockDb.getAllContacts.mockResolvedValue([active, deleted]);

    await useContactsStore.getState().loadContacts();

    expect(useContactsStore.getState().contacts).toHaveLength(2);
  });

  // ── getFilteredContacts ─────────────────────────────────────────────────────

  it("getFilteredContacts returns only active contacts by default", () => {
    const active = makeContact({ id: "a1" });
    const deleted = makeContact({ id: "d1", deletedAt: "2024-06-01T00:00:00Z" });
    useContactsStore.setState({ contacts: [active, deleted] });

    const filtered = useContactsStore.getState().getFilteredContacts();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("a1");
  });

  it("getFilteredContacts returns only deleted contacts when showDeleted=true", () => {
    const active = makeContact({ id: "a1" });
    const deleted = makeContact({ id: "d1", deletedAt: "2024-06-01T00:00:00Z" });
    useContactsStore.setState({ contacts: [active, deleted], showDeleted: true });

    const filtered = useContactsStore.getState().getFilteredContacts();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("d1");
  });

  it("search filter only applies to active view (not deleted view)", () => {
    const active = makeContact({ id: "a1", firstName: "Anna" });
    const deleted = makeContact({ id: "d1", firstName: "Anna", deletedAt: "2024-06-01T00:00:00Z" });
    useContactsStore.setState({
      contacts: [active, deleted],
      searchQuery: "Anna",
      showDeleted: true,
    });

    const filtered = useContactsStore.getState().getFilteredContacts();
    // In deleted view, search query is ignored — all deleted contacts shown
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe("d1");
  });

  // ── getAllTags ──────────────────────────────────────────────────────────────

  it("getAllTags only returns tags from active contacts", () => {
    const active = makeContact({ id: "a1", tags: ["aktiv"] });
    const deleted = makeContact({ id: "d1", tags: ["gelöscht"], deletedAt: "2024-06-01T00:00:00Z" });
    useContactsStore.setState({ contacts: [active, deleted] });

    const tags = useContactsStore.getState().getAllTags();
    expect(tags).toEqual(["aktiv"]);
    expect(tags).not.toContain("gelöscht");
  });

  // ── removeContact (soft-delete) ─────────────────────────────────────────────

  it("removeContact soft-deletes the contact in IndexedDB and Supabase", async () => {
    const contact = makeContact({ id: "c1" });
    useContactsStore.setState({ contacts: [contact] });
    mockDb.softDeleteContact.mockResolvedValue(undefined);
    mockSupabase.removeContactFromSupabase.mockResolvedValue(undefined);

    await useContactsStore.getState().removeContact("c1");

    expect(mockDb.softDeleteContact).toHaveBeenCalledWith("c1");
    expect(mockSupabase.removeContactFromSupabase).toHaveBeenCalledWith("c1");
    // Contact remains in store but with deletedAt set
    const stored = useContactsStore.getState().contacts.find((c) => c.id === "c1");
    expect(stored).toBeDefined();
    expect(stored!.deletedAt).toBeTruthy();
  });

  it("removeContact does NOT remove the contact from in-memory array", async () => {
    const contact = makeContact({ id: "c1" });
    useContactsStore.setState({ contacts: [contact] });
    mockDb.softDeleteContact.mockResolvedValue(undefined);
    mockSupabase.removeContactFromSupabase.mockResolvedValue(undefined);

    await useContactsStore.getState().removeContact("c1");

    expect(useContactsStore.getState().contacts).toHaveLength(1);
  });

  // ── restoreContact ──────────────────────────────────────────────────────────

  it("restoreContact clears deletedAt and saves to IndexedDB and Supabase", async () => {
    const deleted = makeContact({ id: "c1", deletedAt: "2024-06-01T00:00:00Z" });
    useContactsStore.setState({ contacts: [deleted] });
    mockDb.saveContact.mockResolvedValue(undefined);
    mockSupabase.pushContact.mockResolvedValue(undefined);

    await useContactsStore.getState().restoreContact("c1");

    expect(mockDb.saveContact).toHaveBeenCalledWith(expect.objectContaining({ id: "c1", deletedAt: undefined }));
    expect(mockSupabase.pushContact).toHaveBeenCalledWith(expect.objectContaining({ id: "c1" }), "user-1");
    const stored = useContactsStore.getState().contacts.find((c) => c.id === "c1");
    expect(stored!.deletedAt).toBeUndefined();
  });

  it("restoreContact is a no-op when contact not found", async () => {
    useContactsStore.setState({ contacts: [] });
    await useContactsStore.getState().restoreContact("not-found");
    expect(mockDb.saveContact).not.toHaveBeenCalled();
  });

  // ── permanentlyDeleteContact ────────────────────────────────────────────────

  it("permanentlyDeleteContact removes from IndexedDB and hard-deletes from Supabase", async () => {
    const contact = makeContact({ id: "c1", deletedAt: "2024-06-01T00:00:00Z" });
    useContactsStore.setState({ contacts: [contact] });
    mockDb.deleteContact.mockResolvedValue(undefined);
    mockDb.deleteSyncBase.mockResolvedValue(undefined);
    mockSupabase.hardDeleteContactFromSupabase.mockResolvedValue(undefined);

    await useContactsStore.getState().permanentlyDeleteContact("c1");

    expect(mockDb.deleteContact).toHaveBeenCalledWith("c1");
    expect(mockDb.deleteSyncBase).toHaveBeenCalledWith("c1");
    expect(mockSupabase.hardDeleteContactFromSupabase).toHaveBeenCalledWith("c1");
    expect(useContactsStore.getState().contacts).toHaveLength(0);
  });

  it("permanentlyDeleteContact does not call device delete when no deviceContactId", async () => {
    const { Contacts } = await import("@capacitor-community/contacts");
    const contact = makeContact({ id: "c1", deletedAt: "2024-06-01T00:00:00Z" }); // no deviceContactId
    useContactsStore.setState({ contacts: [contact] });
    mockDb.deleteContact.mockResolvedValue(undefined);
    mockDb.deleteSyncBase.mockResolvedValue(undefined);
    mockSupabase.hardDeleteContactFromSupabase.mockResolvedValue(undefined);

    await useContactsStore.getState().permanentlyDeleteContact("c1");

    expect(Contacts.deleteContact).not.toHaveBeenCalled();
  });

  // ── setShowDeleted ──────────────────────────────────────────────────────────

  it("setShowDeleted toggles the showDeleted flag", () => {
    expect(useContactsStore.getState().showDeleted).toBe(false);
    useContactsStore.getState().setShowDeleted(true);
    expect(useContactsStore.getState().showDeleted).toBe(true);
    useContactsStore.getState().setShowDeleted(false);
    expect(useContactsStore.getState().showDeleted).toBe(false);
  });
});
