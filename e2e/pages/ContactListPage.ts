import type { Page, Locator } from "@playwright/test";

export class ContactListPage {
  readonly page: Page;
  readonly fab: Locator;
  readonly syncSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fab = page.getByRole("button", { name: "Kontakt hinzufügen" });
    this.syncSpinner = page.getByRole("progressbar", { name: "Synchronisierung läuft" });
  }

  async goto() {
    await this.page.goto("/");
  }

  async waitForReady() {
    await this.fab.waitFor();
  }

  async waitForSyncComplete() {
    await this.syncSpinner.waitFor({ state: "visible" });
    await this.syncSpinner.waitFor({ state: "hidden" });
  }

  async clickAddContact() {
    await this.fab.click();
  }

  contactRow(fullName: string): Locator {
    return this.page.getByText(fullName);
  }
}
