import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Contact } from "../types/contact";

// Mock Capacitor before importing the module under test
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

vi.mock("@capacitor-community/contacts", () => ({
  Contacts: {
    getContacts: vi.fn(),
    createContact: vi.fn(),
    deleteContact: vi.fn(),
  },
  PhoneType: {
    Mobile: "mobile",
    Home: "home",
    Work: "work",
    Other: "other",
  },
}));

// uuid: stable IDs for assertions
vi.mock("uuid", () => ({ v4: vi.fn(() => "new-uuid") }));

import { Capacitor } from "@capacitor/core";
import { Contacts } from "@capacitor-community/contacts";
import type { ContactPayload } from "@capacitor-community/contacts";
import { PhoneType } from "@capacitor-community/contacts";
import { syncWithDeviceContacts } from "./deviceSync";

const mockCapacitor = vi.mocked(Capacitor);
const mockContacts = vi.mocked(Contacts);

function makeNemaContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "nema-1",
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

function makeDeviceContact(overrides: Partial<ContactPayload> = {}): ContactPayload {
  return {
    contactId: "device-1",
    name: { given: "Max", family: "Mustermann", display: null, middle: null, prefix: null, suffix: null },
    phones: [],
    emails: [],
    ...overrides,
  };
}

describe("syncWithDeviceContacts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContacts.createContact.mockResolvedValue({ contactId: "device-new" });
    mockContacts.deleteContact.mockResolvedValue(undefined);
  });

  it("returns contacts unchanged when not on native platform", async () => {
    mockCapacitor.isNativePlatform.mockReturnValue(false);
    const contacts = [makeNemaContact()];
    const result = await syncWithDeviceContacts(contacts);
    expect(result).toEqual(contacts);
    expect(mockContacts.getContacts).not.toHaveBeenCalled();
  });

  it("returns contacts unchanged when device returns empty list", async () => {
    mockCapacitor.isNativePlatform.mockReturnValue(true);
    mockContacts.getContacts.mockResolvedValue({ contacts: [] });
    const contacts = [makeNemaContact()];
    const result = await syncWithDeviceContacts(contacts);
    expect(result).toHaveLength(1);
    expect(result[0].deviceContactId).toBeUndefined();
  });

  it("matches by deviceContactId and writes nema fields to device", async () => {
    mockCapacitor.isNativePlatform.mockReturnValue(true);
    const nemaContact = makeNemaContact({ deviceContactId: "device-1" });
    mockContacts.getContacts.mockResolvedValue({
      contacts: [makeDeviceContact()],
    });

    const result = await syncWithDeviceContacts([nemaContact]);

    // No update to nema data — already linked
    expect(result[0].deviceContactId).toBe("device-1");
    // Writes to device: delete + recreate
    expect(mockContacts.deleteContact).toHaveBeenCalledWith({ contactId: "device-1" });
    expect(mockContacts.createContact).toHaveBeenCalledOnce();
  });

  it("matches by name (unique) and sets deviceContactId, fills empty fields additively", async () => {
    mockCapacitor.isNativePlatform.mockReturnValue(true);
    const nemaContact = makeNemaContact(); // no deviceContactId
    mockContacts.getContacts.mockResolvedValue({
      contacts: [
        makeDeviceContact({
          phones: [{ type: PhoneType.Mobile, number: "+49 221 123456", isPrimary: true, label: null }],
          emails: [],
        }),
      ],
    });

    const result = await syncWithDeviceContacts([nemaContact]);

    expect(result[0].deviceContactId).toBe("device-1");
    // Phones filled from device (nema was empty)
    expect(result[0].phones).toHaveLength(1);
    expect(result[0].phones[0].number).toBe("+49 221 123456");
  });

  it("does NOT overwrite existing nema phones on name match", async () => {
    mockCapacitor.isNativePlatform.mockReturnValue(true);
    const existingPhone = { id: "p1", type: "mobile" as const, number: "+49 0000" };
    const nemaContact = makeNemaContact({ phones: [existingPhone] });
    mockContacts.getContacts.mockResolvedValue({
      contacts: [
        makeDeviceContact({
          phones: [{ type: PhoneType.Mobile, number: "+49 NEW", isPrimary: true, label: null }],
        }),
      ],
    });

    const result = await syncWithDeviceContacts([nemaContact]);

    // Existing nema phone preserved (additive: only fill if empty)
    expect(result[0].phones[0].number).toBe("+49 0000");
  });

  it("imports duplicate name matches as new nema contacts without auto-link", async () => {
    mockCapacitor.isNativePlatform.mockReturnValue(true);
    // Two nema contacts with same name
    const c1 = makeNemaContact({ id: "nema-1" });
    const c2 = makeNemaContact({ id: "nema-2" });
    mockContacts.getContacts.mockResolvedValue({
      contacts: [makeDeviceContact()],
    });

    const result = await syncWithDeviceContacts([c1, c2]);

    // Original two remain unchanged (no deviceContactId set)
    const original = result.filter((c) => c.id === "nema-1" || c.id === "nema-2");
    expect(original).toHaveLength(2);
    expect(original[0].deviceContactId).toBeUndefined();
    expect(original[1].deviceContactId).toBeUndefined();

    // New contact imported with deviceContactId
    const imported = result.find((c) => c.id !== "nema-1" && c.id !== "nema-2");
    expect(imported).toBeDefined();
    expect(imported!.deviceContactId).toBe("device-1");
  });

  it("fills company from device when nema company is empty on name match", async () => {
    mockCapacitor.isNativePlatform.mockReturnValue(true);
    const nemaContact = makeNemaContact({ company: undefined });
    mockContacts.getContacts.mockResolvedValue({
      contacts: [
        makeDeviceContact({
          organization: { company: "ACME GmbH", jobTitle: null, department: null },
        }),
      ],
    });

    const result = await syncWithDeviceContacts([nemaContact]);

    expect(result[0].company).toBe("ACME GmbH");
  });

  it("does NOT overwrite existing nema company on name match", async () => {
    mockCapacitor.isNativePlatform.mockReturnValue(true);
    const nemaContact = makeNemaContact({ company: "Existing Co." });
    mockContacts.getContacts.mockResolvedValue({
      contacts: [
        makeDeviceContact({
          organization: { company: "Device Co.", jobTitle: null, department: null },
        }),
      ],
    });

    const result = await syncWithDeviceContacts([nemaContact]);

    expect(result[0].company).toBe("Existing Co.");
  });

  it("skips device contacts with no id", async () => {
    mockCapacitor.isNativePlatform.mockReturnValue(true);
    // Cast to bypass strict typing — simulates malformed device data at runtime
    const contactWithoutId = { ...makeDeviceContact(), contactId: "" } as ContactPayload;
    mockContacts.getContacts.mockResolvedValue({ contacts: [contactWithoutId] });
    const contacts = [makeNemaContact()];
    // Guard in deviceSync.ts: `if (!dcId) continue;`
    // Empty string is falsy — treated same as missing id
    const result = await syncWithDeviceContacts(contacts);
    expect(result[0].deviceContactId).toBeUndefined();
  });
});
