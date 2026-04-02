import { test, expect } from "@playwright/test";
import { ContactListPage } from "./pages/ContactListPage";
import { ContactEditPage } from "./pages/ContactEditPage";
import { ContactDetailPage } from "./pages/ContactDetailPage";

// Unique suffix per run to avoid collisions with existing test data
const RUN_ID = Date.now();
const TEST_FIRST_NAME = "Playwright";
const TEST_LAST_NAME = `Test-${RUN_ID}`;
const FULL_NAME_DISPLAY = `${TEST_LAST_NAME}, ${TEST_FIRST_NAME}`;

test.describe("contact management", () => {
  test("create contact, navigate back to list, reload and verify contact persists without timestamp change", async ({
    page,
  }) => {
    const listPage = new ContactListPage(page);
    const editPage = new ContactEditPage(page);
    const detailPage = new ContactDetailPage(page);

    // App loads with session already set via storageState
    await listPage.goto();
    await listPage.waitForReady();

    // Navigate to new contact form
    await listPage.clickAddContact();
    await expect(page).toHaveURL(/\/contacts\/new/);
    await expect(editPage.heading).toBeVisible();

    // Fill in contact data and save
    await editPage.fillName(TEST_FIRST_NAME, TEST_LAST_NAME);
    await editPage.save();

    // After save: redirected to contact detail page (only after sync completes)
    await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
    await expect(detailPage.updatedAt).toBeVisible();

    // Capture updatedAt — must not change after sync (no spurious re-save)
    const updatedAtBefore = await detailPage.getUpdatedAtValue();
    expect(updatedAtBefore).toBeTruthy();

    // Wait for sync to settle and verify timestamp is stable
    await page.waitForTimeout(2_000);
    const updatedAtAfterSync = await detailPage.getUpdatedAtValue();
    expect(updatedAtAfterSync).toBe(updatedAtBefore);

    // Navigate back to contact list
    await detailPage.navigateBack();
    await expect(page).toHaveURL("/");
    await expect(listPage.contactRow(FULL_NAME_DISPLAY)).toBeVisible();

    // Reload and wait for sync cycle to complete
    await page.reload();
    await listPage.waitForSyncComplete();

    // Contact must still be in the list after reload + sync
    await expect(listPage.contactRow(FULL_NAME_DISPLAY)).toBeVisible();

    // Navigate to detail and verify timestamp unchanged after reload
    await listPage.contactRow(FULL_NAME_DISPLAY).click();
    await expect(detailPage.updatedAt).toBeVisible();
    const updatedAtAfterReload = await detailPage.getUpdatedAtValue();
    expect(updatedAtAfterReload).toBe(updatedAtBefore);
  });
});
