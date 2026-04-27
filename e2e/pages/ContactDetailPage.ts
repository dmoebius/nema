import type { Page, Locator } from "@playwright/test";

export class ContactDetailPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly updatedAt: Locator;
  readonly deleteButton: Locator;
  readonly confirmDeleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.getByRole("button", { name: "Zurück" });
    this.updatedAt = page.getByTestId("contact-updated-at");
    this.deleteButton = page.getByRole("button", { name: "Kontakt löschen" });
    this.confirmDeleteButton = page.getByRole("dialog").getByRole("button", { name: "Löschen", exact: true });
  }

  async getUpdatedAtValue(): Promise<string | null> {
    return this.updatedAt.getAttribute("data-value");
  }

  async navigateBack() {
    await this.backButton.click();
  }

  async deleteContact() {
    await this.deleteButton.click();
    await this.confirmDeleteButton.waitFor({ state: "visible" });
    await this.confirmDeleteButton.click();
    // Wait for dialog to close before returning
    await this.confirmDeleteButton.waitFor({ state: "hidden" });
  }
}
