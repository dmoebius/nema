import { test, expect } from "@playwright/test";
import { ContactListPage } from "./pages/ContactListPage";
import { AppMenuPage } from "./pages/AppMenuPage";

test.describe("authentication", () => {
  test("logout via hamburger menu shows login page and clears local data", async ({
    page,
  }) => {
    const listPage = new ContactListPage(page);
    const appMenu = new AppMenuPage(page);

    // Start authenticated (storageState from global setup)
    await listPage.goto();
    await listPage.waitForReady();

    // Logout via hamburger menu
    await appMenu.logout();

    // AuthGuard renders LoginPage in-place (no URL change) — verify login button is visible
    await expect(page.getByRole("button", { name: "Login-Link anfordern" })).toBeVisible();

    // Navigating to "/" without auth must still show login (no cached contacts accessible)
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Login-Link anfordern" })).toBeVisible();
  });
});
