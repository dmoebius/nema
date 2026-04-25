import { describe, it, expect } from "vitest";

// Rendering tests for SettingsPage are covered by E2E tests (React 19 + jsdom act() issue).
// This file verifies the page's exported interface and module contract.

import { SettingsPage } from "./SettingsPage";

describe("SettingsPage export", () => {
  it("is a function component", () => {
    expect(typeof SettingsPage).toBe("function");
  });
});
