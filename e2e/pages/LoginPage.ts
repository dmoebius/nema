import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly confirmationSnackbar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("E-Mail");
    this.submitButton = page.getByRole("button", { name: "Login-Link anfordern" });
    // MUI Snackbar renders into a Portal at the bottom of the DOM
    this.confirmationSnackbar = page.locator("[data-testid='magic-link-snackbar']");
  }

  async requestMagicLink(email: string) {
    await this.emailInput.fill(email);
    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();
  }

  async closeSnackbar() {
    // MUI Alert close button has aria-label="Close"
    await this.page.getByRole("button", { name: "Close" }).click();
  }
}
