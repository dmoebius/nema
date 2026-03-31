import { describe, it, expect } from "vitest";
import { mergeContacts, toTimestamped } from "./merge";
import type { TimestampedContact } from "./merge";
import type { Contact } from "../types/contact";

const baseContact: Contact = {
  id: "1",
  firstName: "Max",
  lastName: "Mustermann",
  company: "ACME",
  phones: [],
  emails: [],
  addresses: [],
  tags: [],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};

describe("mergeContacts", () => {
  it("keeps local change when local is newer", () => {
    const base = toTimestamped(baseContact);
    const local = toTimestamped({
      ...baseContact,
      firstName: "Maximilian",
      updatedAt: "2024-01-02T00:00:00Z",
    });
    local.fieldTimestamps.firstName = "2024-01-02T00:00:00Z";

    const remote = toTimestamped(baseContact);

    const result = mergeContacts(base, local, remote);
    expect(result.firstName).toBe("Maximilian");
  });

  it("takes remote change when remote is newer", () => {
    const base = toTimestamped(baseContact);
    const local = toTimestamped(baseContact);

    const remote = toTimestamped({
      ...baseContact,
      firstName: "Moritz",
      updatedAt: "2024-01-03T00:00:00Z",
    });
    remote.fieldTimestamps.firstName = "2024-01-03T00:00:00Z";

    const result = mergeContacts(base, local, remote);
    expect(result.firstName).toBe("Moritz");
  });

  it("merges non-conflicting changes from both sides", () => {
    const base = toTimestamped(baseContact);

    // Local only changed firstName — explicitly set only that timestamp
    const local: TimestampedContact = {
      ...toTimestamped(baseContact),
      firstName: "Maximilian",
      updatedAt: "2024-01-02T00:00:00Z",
      fieldTimestamps: {
        ...base.fieldTimestamps,
        firstName: "2024-01-02T00:00:00Z",
      },
    };

    // Remote only changed company — explicitly set only that timestamp
    const remote: TimestampedContact = {
      ...toTimestamped(baseContact),
      company: "NewCorp",
      updatedAt: "2024-01-03T00:00:00Z",
      fieldTimestamps: {
        ...base.fieldTimestamps,
        company: "2024-01-03T00:00:00Z",
      },
    };

    const result = mergeContacts(base, local, remote);
    expect(result.firstName).toBe("Maximilian");
    expect(result.company).toBe("NewCorp");
  });

  it("resolves conflict by last-write-wins per attribute", () => {
    const base = toTimestamped(baseContact);

    const local = toTimestamped({
      ...baseContact,
      firstName: "Local Name",
      updatedAt: "2024-01-02T00:00:00Z",
    });
    local.fieldTimestamps.firstName = "2024-01-02T00:00:00Z";

    const remote = toTimestamped({
      ...baseContact,
      firstName: "Remote Name",
      updatedAt: "2024-01-03T00:00:00Z",
    });
    remote.fieldTimestamps.firstName = "2024-01-03T00:00:00Z";

    const result = mergeContacts(base, local, remote);
    // Remote wins because it has a later timestamp
    expect(result.firstName).toBe("Remote Name");
  });

  it("never modifies id or createdAt", () => {
    const base = toTimestamped(baseContact);
    const local = toTimestamped({ ...baseContact, updatedAt: "2024-01-02T00:00:00Z" });
    const remote = toTimestamped({ ...baseContact, updatedAt: "2024-01-03T00:00:00Z" });

    const result = mergeContacts(base, local, remote);
    expect(result.id).toBe("1");
    expect(result.createdAt).toBe("2024-01-01T00:00:00Z");
  });
});
