import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly confirmationSnackbar: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use the native input element directly — MUI TextField with type="email" requires
    // targeting the underlying <input> for Playwright fill() to trigger React's onChange
    this.emailInput = page.locator('input[type="email"]');
    this.submitButton = page.getByRole("button", { name: "Login-Link anfordern" });
    // MUI Snackbar renders into a Portal at the bottom of the DOM
    this.confirmationSnackbar = page.locator("[data-testid='magic-link-snackbar']");
  }

  async requestMagicLink(email: string) {
    // Click the input first to ensure focus, then type char by char to trigger React onChange
    await this.emailInput.click();
    await this.emailInput.pressSequentially(email);
    // Wait until the button becomes enabled (React state updated with typed email)
    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();
  }

  async closeSnackbar() {
    // MUI Alert close button has aria-label="Close"
    await this.page.getByRole("button", { name: "Close" }).click();
  }
}
