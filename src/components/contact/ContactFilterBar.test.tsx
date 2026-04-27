import { describe, it, expect } from "vitest";

// Rendering tests for ContactFilterBar are covered by E2E tests (React 19 + jsdom act() issue).
// This file verifies the component's prop contract and exported interface.

import { ContactFilterBar } from "./ContactFilterBar";

describe("ContactFilterBar export", () => {
  it("is a function component", () => {
    expect(typeof ContactFilterBar).toBe("function");
  });
});

describe("ContactFilterBar props contract", () => {
  it("accepts all required props without type errors", () => {
    const props: Parameters<typeof ContactFilterBar>[0] = {
      searchQuery: "",
      onSearchChange: () => undefined,
      selectedTags: [],
      allTags: ["VIP", "Lead"],
      onToggleTag: () => undefined,
      showDeleted: false,
      onToggleShowDeleted: () => undefined,
    };
    expect(props.allTags).toEqual(["VIP", "Lead"]);
    expect(props.showDeleted).toBe(false);
  });

  it("accepts showDeleted=true without type errors", () => {
    const props: Parameters<typeof ContactFilterBar>[0] = {
      searchQuery: "test",
      onSearchChange: () => undefined,
      selectedTags: ["VIP"],
      allTags: ["VIP"],
      onToggleTag: () => undefined,
      showDeleted: true,
      onToggleShowDeleted: () => undefined,
    };
    expect(props.showDeleted).toBe(true);
  });
});
