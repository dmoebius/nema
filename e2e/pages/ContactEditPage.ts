import type { Page, Locator } from "@playwright/test";

export class ContactEditPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Neuer Kontakt" });
    this.firstNameInput = page.getByLabel("Vorname");
    this.lastNameInput = page.getByLabel("Nachname");
    this.saveButton = page.getByRole("button", { name: "Speichern" });
  }

  async fillName(firstName: string, lastName: string) {
    await this.firstNameInput.fill(firstName);
    await this.lastNameInput.fill(lastName);
  }

  async save() {
    await this.saveButton.click();
  }
}
