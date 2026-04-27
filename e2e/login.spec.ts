import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

// Login page tests must run without a stored auth session
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("login page", () => {
  test("shows email and password fields", async ({ page }) => {
    await page.goto("/");
    const loginPage = new LoginPage(page);
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toBeDisabled();
  });

  test("submit button enabled only when both fields filled", async ({ page }) => {
    await page.goto("/");
    const loginPage = new LoginPage(page);
    await loginPage.emailInput.fill("user@example.com");
    await expect(loginPage.submitButton).toBeDisabled();
    await loginPage.passwordInput.fill("secret");
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test("shows error on wrong credentials", async ({ page }) => {
    await page.goto("/");
    const loginPage = new LoginPage(page);
    await loginPage.login("wrong@example.com", "wrongpassword");
    await expect(page.getByText("E-Mail oder Passwort falsch.")).toBeVisible();
  });

  test("successful login redirects to contact list", async ({ page }) => {
    await page.goto("/");
    const loginPage = new LoginPage(page);
    await loginPage.login(process.env.E2E_TEST_EMAIL!, process.env.E2E_TEST_PASSWORD!);
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "nema" })).toBeVisible();
  });

  test("forgot password link shows reset form", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Passwort vergessen?" }).click();
    await expect(page.getByRole("button", { name: "Reset-Link anfordern" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zurück zum Login" })).toBeVisible();
  });
});
