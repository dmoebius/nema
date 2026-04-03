import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load test env vars from .env.test.local (not committed)
dotenv.config({ path: path.resolve(__dirname, ".env.test.local") });

// In containerized / sandboxed environments (no root, no user namespaces),
// Chromium needs --no-sandbox. Also inject local browser libs if present
// (needed when system Chromium deps are missing and can't be installed via apt).
const isCI = !!process.env.CI;
const localLibsDir = path.join(os.homedir(), ".local/chromium-libs/extracted");
const localLibPaths = [
  path.join(localLibsDir, "lib/x86_64-linux-gnu"),
  path.join(localLibsDir, "usr/lib/x86_64-linux-gnu"),
];
const chromiumEnv: Record<string, string> = {};
if (!isCI) {
  const existing = process.env.LD_LIBRARY_PATH ?? "";
  chromiumEnv["LD_LIBRARY_PATH"] = [
    ...localLibPaths,
    ...(existing ? [existing] : []),
  ].join(":");
}

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
        // More reliable in containerized environments.
        channel: "chromium",
        storageState: "playwright/.auth/user.json",
        launchOptions: {
          // Required in Docker/sandbox environments without user namespaces.
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
          env: chromiumEnv,
        },
      },
      dependencies: ["setup"],
    },
  ],

  // Local: start Vite dev server. CI: serve the pre-built dist via vite preview.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: process.env.CI ? "pnpm preview --port 5173" : "pnpm dev",
        url: "http://localhost:5173",
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
