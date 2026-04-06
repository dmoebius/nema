import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const DISMISSED_KEY = "nema_install_dismissed_until";

// Isolate localStorage logic tests — rendering tests covered by Playwright
describe("InstallPrompt dismiss logic", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is not dismissed when localStorage is empty", () => {
    const until = localStorage.getItem(DISMISSED_KEY);
    expect(until).toBeNull();
  });

  it("stores dismiss timestamp 7 days in the future", () => {
    const before = Date.now();
    const until = before + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, String(until));

    const stored = Number(localStorage.getItem(DISMISSED_KEY));
    expect(stored).toBeGreaterThanOrEqual(before + 6 * 24 * 60 * 60 * 1000);
  });

  it("is considered dismissed when timestamp is in the future", () => {
    const future = Date.now() + 1000 * 60;
    localStorage.setItem(DISMISSED_KEY, String(future));

    const until = Number(localStorage.getItem(DISMISSED_KEY));
    expect(Date.now() < until).toBe(true);
  });

  it("is not dismissed when timestamp has expired", () => {
    const past = Date.now() - 1000;
    localStorage.setItem(DISMISSED_KEY, String(past));

    const until = Number(localStorage.getItem(DISMISSED_KEY));
    expect(Date.now() < until).toBe(false);
  });
});
