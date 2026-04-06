import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load test env vars from .env.local (not committed)
dotenv.config({ path: path.resolve(__dirname, ".env.local") });


export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Sequential to avoid IndexedDB conflicts between tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
  },
  expect: {
    timeout: 15_000,
  },

  projects: [
    // Auth setup runs once before all tests
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use new headless mode (real Chrome engine, not headless shell).
        channel: "chromium",
        storageState: "playwright/.auth/user.json",
        launchOptions: {
          // Required in sandboxed/containerized environments without user namespaces.
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      },
      dependencies: ["setup"],
    },
  ],

  // Serve the pre-built dist via vite preview (local + CI).
  // Run `pnpm build` before running tests locally.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm preview --port 5173",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
