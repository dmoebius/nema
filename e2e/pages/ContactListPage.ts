import type { Page, Locator } from "@playwright/test";

export class ContactListPage {
  readonly page: Page;
  readonly fab: Locator;
  readonly syncSpinner: Locator;
  readonly emptyState: Locator;
  readonly showDeletedChip: Locator;
  readonly emptyDeletedState: Locator;
  readonly contactsLoadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fab = page.getByRole("button", { name: "Kontakt hinzufügen" });
    this.syncSpinner = page.getByRole("progressbar", { name: "Synchronisierung läuft" });
    this.emptyState = page.getByText("Noch keine Kontakte?");
    this.showDeletedChip = page.getByRole("button", { name: "Ausgeblendete" });
    this.emptyDeletedState = page.getByText("Keine ausgeblendeten Kontakte");
    this.contactsLoadingSpinner = page.getByRole("progressbar", { name: "Kontakte werden geladen" });
  }

  async goto() {
    await this.page.goto("/");
  }

  async waitForReady() {
    await this.fab.waitFor({ state: "visible" });
  }

  /** Wait for any in-flight sync spinner to finish. Safe to call even if spinner never appears. */
  async waitForSyncSettled() {
    // Give the spinner up to 2s to appear; if it does, wait for it to go away
    const appeared = await this.syncSpinner
      .waitFor({ state: "visible", timeout: 2000 })
      .then(() => true)
      .catch(() => false);
    if (appeared) {
      await this.syncSpinner.waitFor({ state: "hidden" });
    }
  }

  /** Wait for any in-flight contacts loading spinner to finish. Safe to call even if spinner never appears. */
  async waitForContactsLoaded() {
    // Give the spinner up to 2s to appear; if it does, wait for it to go away
    const appeared = await this.contactsLoadingSpinner
      .waitFor({ state: "visible", timeout: 2000 })
      .then(() => true)
      .catch(() => false);
    if (appeared) {
      await this.contactsLoadingSpinner.waitFor({ state: "hidden" });
    }
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
    const box = await this.contactRow(fullName).boundingBox();
    if (!box) throw new Error(`Contact row not found: ${fullName}`);
    return box.y;
  }

  async toggleShowDeleted() {
    await this.showDeletedChip.waitFor({ state: "visible" });
    await this.showDeletedChip.click();
  }

  restoreButton(fullName: string): Locator {
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

  restoreButtonByLabel(fullName?: string): Locator {
    if (fullName) {
      const [last, first] = fullName.split(", ");
      const name = [first, last].filter(Boolean).join(" ");
      return this.page.getByRole("button", { name: `Kontakt wiederherstellen: ${name}` });
    }
    return this.page.getByRole("button", { name: /Kontakt wiederherstellen/ }).first();
  }

  permanentDeleteButtonByLabel(fullName?: string): Locator {
    if (fullName) {
      const [last, first] = fullName.split(", ");
      const name = [first, last].filter(Boolean).join(" ");
      return this.page.getByRole("button", { name: `Kontakt endgültig löschen: ${name}` });
    }
    return this.page.getByRole("button", { name: /Kontakt endgültig löschen/ }).first();
  }
}
