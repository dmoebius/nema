import type { Page, Locator } from "@playwright/test";

export class AppMenuPage {
  readonly page: Page;
  readonly menuButton: Locator;
  readonly logoutMenuItem: Locator;

  constructor(page: Page) {
    this.page = page;
    this.menuButton = page.getByRole("button", { name: "Menü öffnen" });
    this.logoutMenuItem = page.getByRole("menuitem", { name: "Abmelden" });
  }

  async logout() {
    await this.menuButton.click();
    await this.logoutMenuItem.click();
  }
}
