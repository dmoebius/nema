import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Contact } from "../types/contact";
import { toTimestamped } from "./merge";

// Mock IndexedDB helpers
vi.mock("../db", () => ({
  getAllContacts: vi.fn(),
  saveContact: vi.fn(),
  deleteContact: vi.fn(),
  getSyncBase: vi.fn(),
  setSyncBase: vi.fn(),
  deleteSyncBase: vi.fn(),
}));

// Mock Supabase client
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
  },
}));

import * as db from "../db";
import { supabase } from "../lib/supabase";
import { syncAll } from "./supabaseSync";

const userId = "user-123";

const makeContact = (overrides: Partial<Contact> = {}): Contact => ({
  id: "contact-1",
  firstName: "Max",
  lastName: "Mustermann",
  phones: [],
  emails: [],
  addresses: [],
  tags: [],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  ...overrides,
});

const makeSupabaseChain = (data: unknown[], error: unknown = null) => ({
  select: vi.fn().mockReturnThis(),
  order: vi.fn().mockResolvedValue({ data, error }),
  upsert: vi.fn().mockResolvedValue({ error: null }),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockResolvedValue({ error: null }),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("syncAll", () => {
  it("saves remote-only contact locally", async () => {
    const remoteRow = {
      id: "remote-1",
      first_name: "Max",
      last_name: "Mustermann",
      phones: [],
      emails: [],
      addresses: [],
      tags: [],
      field_timestamps: {},
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    vi.mocked(supabase.from).mockReturnValue(makeSupabaseChain([remoteRow]) as never);
    vi.mocked(db.getAllContacts).mockResolvedValue([]);
    vi.mocked(db.getSyncBase).mockResolvedValue(undefined);

    await syncAll(userId);

    expect(db.saveContact).toHaveBeenCalledWith(expect.objectContaining({ id: "remote-1" }));
    expect(db.setSyncBase).toHaveBeenCalledWith(expect.objectContaining({ id: "remote-1" }));
  });

  it("pushes local-only contact to remote", async () => {
    const local = makeContact({ id: "local-1" });

    vi.mocked(supabase.from).mockReturnValue(makeSupabaseChain([]) as never);
    vi.mocked(db.getAllContacts).mockResolvedValue([local]);
    vi.mocked(db.getSyncBase).mockResolvedValue(undefined);

    await syncAll(userId);

    expect(supabase.from).toHaveBeenCalledWith("contacts");
  });

  it("skips sync when both sides have same updatedAt", async () => {
    const contact = makeContact();
    const remoteRow = {
      id: "contact-1",
      first_name: "Max",
      last_name: "Mustermann",
      phones: [],
      emails: [],
      addresses: [],
      tags: [],
      field_timestamps: {},
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    vi.mocked(supabase.from).mockReturnValue(makeSupabaseChain([remoteRow]) as never);
    vi.mocked(db.getAllContacts).mockResolvedValue([contact]);
    vi.mocked(db.getSyncBase).mockResolvedValue(toTimestamped(contact));

    await syncAll(userId);

    // saveContact should not be called for unchanged contacts
    expect(db.saveContact).not.toHaveBeenCalled();
  });
});
