import type { Page, Locator } from "@playwright/test";

export interface ContactData {
  firstName: string;
  lastName: string;
  company?: string;
  phone?: { number: string };
  email?: { address: string };
  address?: { street: string; zip: string; city: string; country: string };
  birthday?: string; // YYYY-MM-DD
  tags?: string[];
  note?: string;
}

export class ContactEditPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly companyInput: Locator;
  readonly birthdayInput: Locator;
  readonly noteInput: Locator;
  readonly saveButton: Locator;
  readonly addPhoneButton: Locator;
  readonly addEmailButton: Locator;
  readonly addAddressButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { name: "Neuer Kontakt" });
    this.firstNameInput = page.getByLabel("Vorname");
    this.lastNameInput = page.getByLabel("Nachname");
    this.companyInput = page.getByLabel("Firma / Organisation");
    this.birthdayInput = page.getByLabel("Datum");
    this.noteInput = page.getByLabel("Notiz");
    this.saveButton = page.getByRole("button", { name: "Speichern" });
    this.addPhoneButton = page.getByRole("button", { name: "Telefonnummer hinzufügen" });
    this.addEmailButton = page.getByRole("button", { name: "E-Mail hinzufügen" });
    this.addAddressButton = page.getByRole("button", { name: "Adresse hinzufügen" });
  }

  async fill(contact: ContactData) {
    await this.firstNameInput.fill(contact.firstName);
    await this.lastNameInput.fill(contact.lastName);

    if (contact.company) {
      await this.companyInput.fill(contact.company);
    }

    if (contact.phone) {
      await this.addPhoneButton.click();
      await this.page.getByLabel("Nummer").last().fill(contact.phone.number);
    }

    if (contact.email) {
      await this.addEmailButton.click();
      await this.page.getByLabel("E-Mail").last().fill(contact.email.address);
    }

    if (contact.address) {
      await this.addAddressButton.click();
      await this.page.getByLabel("Straße").fill(contact.address.street);
      await this.page.getByLabel("PLZ").fill(contact.address.zip);
      await this.page.getByLabel("Ort").fill(contact.address.city);
      await this.page.getByLabel("Land").fill(contact.address.country);
    }

    if (contact.birthday) {
      await this.birthdayInput.fill(contact.birthday);
    }

    if (contact.tags && contact.tags.length > 0) {
      const tagInput = this.page.getByLabel("Tags eingeben oder auswählen");
      await tagInput.waitFor({ state: "visible" });
      for (const tag of contact.tags) {
        await tagInput.fill(tag);
        await this.page.keyboard.press("Enter");
      }
    }

    if (contact.note) {
      await this.noteInput.fill(contact.note);
    }
  }

  async save() {
    await this.saveButton.click();
  }
}
