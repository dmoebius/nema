import type { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly confirmationSnackbar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("E-Mail");
    this.submitButton = page.getByRole("button", { name: "Login-Link anfordern" });
    this.confirmationSnackbar = page.getByText(/Falls diese E-Mail-Adresse berechtigt ist/);
  }

  async requestMagicLink(email: string) {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
