import { test, expect, chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { AppMenuPage } from "./pages/AppMenuPage";
import { ContactListPage } from "./pages/ContactListPage";


// ──────────────────────────────────────────────────────────────────────────────
// Logout test — uses an isolated browser context so it does not invalidate
// the shared storageState used by all other test files.
// ──────────────────────────────────────────────────────────────────────────────
test.describe("authentication — logout", () => {
  test("logout via hamburger menu shows login page and clears local data", async () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL!;
    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
    const email = process.env.E2E_TEST_EMAIL!;
    const password = process.env.E2E_TEST_PASSWORD!;
    const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:5173";

    // Sign in to get a fresh session (separate from the shared storageState)
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new Error(`Login failed: ${error?.message}`);

    // Launch an isolated browser context — does not share storageState with other tests
    const browser = await chromium.launch();
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();

    // Inject session into localStorage
    await page.goto("/");
    await page.evaluate(
      ({ url, session }) => {
        const key = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
        localStorage.setItem(key, JSON.stringify(session));
      },
      { url: supabaseUrl, session: data.session },
    );
    await page.reload();

    const listPage = new ContactListPage(page);
    const appMenu = new AppMenuPage(page);

    await listPage.waitForReady();

    // Logout via hamburger menu
    await appMenu.logout();

    // AuthGuard renders LoginPage in-place — verify login button is visible
    await expect(page.getByRole("button", { name: "Login-Link anfordern" })).toBeVisible();

    // Navigating to "/" without auth must still show login (no cached contacts accessible)
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Login-Link anfordern" })).toBeVisible();

    await context.close();
    await browser.close();
  });
});


