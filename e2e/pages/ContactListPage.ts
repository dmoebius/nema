import type { Page, Locator } from "@playwright/test";

export class ContactListPage {
  readonly page: Page;
  readonly fab: Locator;
  readonly syncSpinner: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fab = page.getByRole("button", { name: "Kontakt hinzufügen" });
    this.syncSpinner = page.getByRole("progressbar", { name: "Synchronisierung läuft" });
    this.emptyState = page.getByText("Noch keine Kontakte?");
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

  async contactRowIndex(fullName: string): Promise<number> {
    // Returns the vertical position (y) of the row — used to verify sort order
    const box = await this.contactRow(fullName).boundingBox();
    if (!box) throw new Error(`Contact row not found: ${fullName}`);
    return box.y;
  }
}
