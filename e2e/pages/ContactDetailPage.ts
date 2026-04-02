import type { Page, Locator } from "@playwright/test";

export class ContactDetailPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly updatedAt: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.getByRole("button", { name: "Zurück" });
    this.updatedAt = page.getByTestId("contact-updated-at");
  }

  async getUpdatedAtValue(): Promise<string | null> {
    return this.updatedAt.getAttribute("data-value");
  }

  async navigateBack() {
    await this.backButton.click();
  }
}
