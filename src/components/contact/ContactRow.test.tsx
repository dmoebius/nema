import { describe, it, expect } from "vitest";
import { getInitials, getAvatarColor } from "./contactUtils";
import type { Contact } from "../../types/contact";

// Rendering tests for ContactRow are covered by E2E tests (React 19 + jsdom act() issue).
// This file tests the pure utility functions extracted from the component.

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

describe("getInitials", () => {
  it("returns first letters of first and last name uppercased", () => {
    expect(getInitials(makeContact({ firstName: "Max", lastName: "Mustermann" }))).toBe("MM");
  });

  it("returns ? when both names are empty", () => {
    expect(getInitials(makeContact({ firstName: "", lastName: "" }))).toBe("?");
  });

  it("returns single initial when last name is empty", () => {
    expect(getInitials(makeContact({ firstName: "Anna", lastName: "" }))).toBe("A");
  });

  it("returns single initial when first name is empty", () => {
    expect(getInitials(makeContact({ firstName: "", lastName: "Müller" }))).toBe("M");
  });

  it("handles lowercase names", () => {
    expect(getInitials(makeContact({ firstName: "anna", lastName: "berg" }))).toBe("AB");
  });
});

describe("getAvatarColor", () => {
  it("returns a hex color string", () => {
    expect(getAvatarColor("Max Mustermann")).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("returns the same color for the same name (deterministic)", () => {
    expect(getAvatarColor("test")).toBe(getAvatarColor("test"));
  });

  it("returns different colors for different names", () => {
    // Not guaranteed by hash, but very likely for distinct strings
    const colors = new Set(["Alice", "Bob", "Charlie", "Diana", "Eve"].map(getAvatarColor));
    // At least 2 distinct colors among 5 names
    expect(colors.size).toBeGreaterThanOrEqual(2);
  });
});
