import { test as setup, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const AUTH_FILE = path.join(__dirname, "../playwright/.auth/user.json");

setup("authenticate", async ({ page }) => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;

  if (!supabaseUrl || !supabaseAnonKey || !email || !password) {
    throw new Error(
      "Missing required env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, E2E_TEST_EMAIL, E2E_TEST_PASSWORD",
    );
  }

  // Sign in via Supabase client to obtain a session token
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    throw new Error(`Login failed: ${error?.message ?? "No session returned"}`);
  }

  // Navigate to the app and inject the session into localStorage
  await page.goto("/");

  await page.evaluate(
    ({ url, session }) => {
      const key = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
      localStorage.setItem(key, JSON.stringify(session));
    },
    { url: supabaseUrl, session: data.session },
  );

  // Reload so the app picks up the injected session
  await page.reload();

  // Wait until the contact list is visible (FAB = authenticated + loaded)
  await expect(page.getByRole("button", { name: "Kontakt hinzufügen" })).toBeVisible({
    timeout: 10_000,
  });

  // Persist authenticated browser state for all subsequent tests
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  await page.context().storageState({ path: AUTH_FILE });
});
