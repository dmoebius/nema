import type { Page, Locator } from "@playwright/test";

export class ContactListPage {
  readonly page: Page;
  readonly fab: Locator;
  readonly syncSpinner: Locator;
  readonly emptyState: Locator;
  readonly showDeletedChip: Locator;
  readonly emptyDeletedState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fab = page.getByRole("button", { name: "Kontakt hinzufügen" });
    this.syncSpinner = page.getByRole("progressbar", { name: "Synchronisierung läuft" });
    this.emptyState = page.getByText("Noch keine Kontakte?");
    this.showDeletedChip = page.getByText("Ausgeblendete");
    this.emptyDeletedState = page.getByText("Keine ausgeblendeten Kontakte");
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

  async toggleShowDeleted() {
    await this.showDeletedChip.click();
  }

  restoreButton(fullName: string): Locator {
    // The restore button is in the same row as the contact
    return this.page
      .locator(`text=${fullName}`)
      .locator("..")
      .locator("..")
      .getByRole("button", { name: "Kontakt wiederherstellen" });
  }

  permanentDeleteButton(fullName: string): Locator {
    return this.page
      .locator(`text=${fullName}`)
      .locator("..")
      .locator("..")
      .getByRole("button", { name: "Kontakt endgültig löschen" });
  }

  // Alternative: find restore/delete buttons by their aria-labels in the deleted view
  restoreButtonByLabel(): Locator {
    return this.page.getByRole("button", { name: "Kontakt wiederherstellen" }).first();
  }

  permanentDeleteButtonByLabel(): Locator {
    return this.page.getByRole("button", { name: "Kontakt endgültig löschen" }).first();
  }
}
