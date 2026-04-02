import { test, expect } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";

// Unauthenticated tests — override storageState at the file level
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("login page", () => {
  test("magic link request shows confirmation snackbar for valid and unknown email", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);

    await page.goto("/");
    await expect(loginPage.submitButton).toBeVisible();

    // Known (valid) email — must show confirmation snackbar
    await loginPage.requestMagicLink(process.env.E2E_TEST_EMAIL!);
    await expect(loginPage.confirmationSnackbar).toBeVisible();

    // Close snackbar via its close button, then test with unknown email
    await loginPage.closeSnackbar();
    await expect(loginPage.confirmationSnackbar).not.toBeVisible();

    // Unknown email — must show the same confirmation (prevents enumeration)
    await loginPage.requestMagicLink("unknown-user@example.invalid");
    await expect(loginPage.confirmationSnackbar).toBeVisible();
  });
});
