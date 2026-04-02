import { test, expect } from "@playwright/test";
import { ContactListPage } from "./pages/ContactListPage";
import { ContactEditPage } from "./pages/ContactEditPage";
import { ContactDetailPage } from "./pages/ContactDetailPage";
import type { ContactData } from "./pages/ContactEditPage";

// Unique suffix per run to avoid collisions with existing test data
const RUN_ID = Date.now();

const MINIMAL_CONTACT: ContactData = {
  firstName: "Minimal",
  lastName: `Test-${RUN_ID}-A`,
};

const FULL_CONTACT: ContactData = {
  firstName: "Maximal",
  lastName: `Test-${RUN_ID}-B`,
  company: "Playwright GmbH",
  phone: { number: "+49 221 123456" },
  email: { address: `playwright-${RUN_ID}@test.example` },
  address: { street: "Teststraße 1", zip: "50667", city: "Köln", country: "Deutschland" },
  birthday: "1990-04-02",
  tags: ["E2E", "Test"],
  note: "Automatically created by Playwright e2e test.",
};

// Display format: "Nachname, Vorname" (sorted by lastName)
const minimalDisplay = `${MINIMAL_CONTACT.lastName}, ${MINIMAL_CONTACT.firstName}`;
const fullDisplay = `${FULL_CONTACT.lastName}, ${FULL_CONTACT.firstName}`;

async function createContact(
  page: import("@playwright/test").Page,
  listPage: ContactListPage,
  contact: ContactData,
): Promise<void> {
  await listPage.clickAddContact();
  const editPage = new ContactEditPage(page);
  await expect(editPage.heading).toBeVisible();
  await editPage.fill(contact);
  await editPage.save();
  // After save: redirected to detail page (sync completes before navigation)
  await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
}

test.describe("contact management", () => {
  test("create minimal and full contact, verify list order, reload and verify persistence", async ({
    page,
  }) => {
    const listPage = new ContactListPage(page);
    const detailPage = new ContactDetailPage(page);

    await listPage.goto();
    await listPage.waitForReady();

    // Create minimal contact (first name + last name only)
    await createContact(page, listPage, MINIMAL_CONTACT);

    // Capture updatedAt — must not change after sync
    await expect(detailPage.updatedAt).toBeVisible();
    const minimalUpdatedAt = await detailPage.getUpdatedAtValue();
    expect(minimalUpdatedAt).toBeTruthy();

    await detailPage.navigateBack();
    await expect(page).toHaveURL("/");
    await expect(listPage.contactRow(minimalDisplay)).toBeVisible();

    // Create full contact (all fields)
    await createContact(page, listPage, FULL_CONTACT);

    // Capture updatedAt for full contact
    await expect(detailPage.updatedAt).toBeVisible();
    const fullUpdatedAt = await detailPage.getUpdatedAtValue();
    expect(fullUpdatedAt).toBeTruthy();

    await detailPage.navigateBack();
    await expect(page).toHaveURL("/");

    // Both contacts must appear in the list
    await expect(listPage.contactRow(minimalDisplay)).toBeVisible();
    await expect(listPage.contactRow(fullDisplay)).toBeVisible();

    // Verify sort order: list is sorted by lastName ascending (de locale)
    // MINIMAL_CONTACT.lastName ends with "-A", FULL_CONTACT ends with "-B" → A before B
    const minimalIndex = await listPage.contactRowIndex(minimalDisplay);
    const fullIndex = await listPage.contactRowIndex(fullDisplay);
    expect(minimalIndex).toBeLessThan(fullIndex);

    // Reload and wait for sync to complete
    await page.reload();
    await listPage.waitForSyncComplete();

    // Both contacts must still be present after reload
    await expect(listPage.contactRow(minimalDisplay)).toBeVisible();
    await expect(listPage.contactRow(fullDisplay)).toBeVisible();

    // Timestamps must be unchanged after reload+sync (no spurious re-save)
    await listPage.contactRow(minimalDisplay).click();
    await expect(detailPage.updatedAt).toBeVisible();
    expect(await detailPage.getUpdatedAtValue()).toBe(minimalUpdatedAt);
    await detailPage.navigateBack();

    await listPage.contactRow(fullDisplay).click();
    await expect(detailPage.updatedAt).toBeVisible();
    expect(await detailPage.getUpdatedAtValue()).toBe(fullUpdatedAt);
    await detailPage.navigateBack();

    // Delete minimal contact — list must only show full contact afterwards
    await listPage.contactRow(minimalDisplay).click();
    await detailPage.deleteContact();
    await expect(page).toHaveURL("/");
    await expect(listPage.contactRow(minimalDisplay)).not.toBeVisible();
    await expect(listPage.contactRow(fullDisplay)).toBeVisible();

    // Delete full contact — list must be empty afterwards
    await listPage.contactRow(fullDisplay).click();
    await detailPage.deleteContact();
    await expect(page).toHaveURL("/");
    await expect(listPage.contactRow(fullDisplay)).not.toBeVisible();
    await expect(listPage.emptyState).toBeVisible();
  });
});
