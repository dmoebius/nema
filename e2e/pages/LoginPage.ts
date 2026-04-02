import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly confirmationSnackbar: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use the native input element directly — MUI TextField with type="email" requires
    // targeting the underlying <input> for Playwright fill() to trigger React's onChange
    this.emailInput = page.locator('input[type="email"]');
    this.submitButton = page.getByRole("button", { name: "Login-Link anfordern" });
    // MUI Snackbar renders into a Portal at the bottom of the DOM
    this.confirmationSnackbar = page.locator("[data-testid='magic-link-snackbar']");
  }

  async requestMagicLink(email: string) {
    // Use evaluate to set the value and dispatch a React-compatible input event.
    // Necessary because autoFocus + type="email" in CI can prevent Playwright's
    // fill/type from triggering React's synthetic onChange handler.
    await this.emailInput.evaluate((el: HTMLInputElement, value) => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeInputValueSetter?.call(el, value);
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }, email);
    // Wait until the button becomes enabled (React state updated)
    await expect(this.submitButton).toBeEnabled();
    await this.submitButton.click();
  }

  async closeSnackbar() {
    // MUI Alert close button has aria-label="Close"
    await this.page.getByRole("button", { name: "Close" }).click();
  }
}
