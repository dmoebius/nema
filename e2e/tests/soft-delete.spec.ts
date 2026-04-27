import { test, expect } from "@playwright/test";
import { ContactListPage } from "../pages/ContactListPage";
import { ContactEditPage } from "../pages/ContactEditPage";
import { ContactDetailPage } from "../pages/ContactDetailPage";
import type { ContactData } from "../pages/ContactEditPage";

// Unique suffix per run to avoid collisions with existing test data
const RUN_ID = Date.now();

const MINIMAL_CONTACT: ContactData = {
  firstName: "Soft",
  lastName: `Delete-${RUN_ID}-Min`,
};

const FULL_CONTACT: ContactData = {
  firstName: "Vollständig",
  lastName: `Delete-${RUN_ID}-Max`,
  company: "Ausblende GmbH",
  phone: { number: "+49 221 987654" },
  email: { address: `softdelete-${RUN_ID}@test.example` },
  tags: ["E2E", "SoftDelete"],
  note: "Created by soft-delete E2E test.",
};

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
  await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
}

async function softDeleteCurrentContact(
  page: import("@playwright/test").Page,
  listPage: ContactListPage,
): Promise<void> {
  const detailPage = new ContactDetailPage(page);
  await detailPage.deleteContact();
  // Wait for app's own redirect to complete (ensures IDB write is done)
  await expect(page).toHaveURL("/");
  // Move mouse away from list area to prevent ghost-clicks on CI
  await page.mouse.move(0, 0);
  await listPage.waitForReady();
  // Wait for any in-flight Supabase Realtime sync triggered by the delete
  await listPage.waitForSyncSettled();
  // On slower CI runners, Supabase Realtime + sync completion can briefly
  // trigger a ghost-navigation away from "/". Re-anchor if needed.
  if (!(page.url().endsWith("/") || page.url() === "http://localhost:5173")) {
    await listPage.goto();
    await listPage.waitForReady();
  }
}

test.describe("soft-delete flow", () => {
  test("create minimal and full contact, soft-delete both, verify deleted view, restore minimal, permanently delete full", async ({
    page,
  }) => {
    const listPage = new ContactListPage(page);

    await listPage.goto();
    await listPage.waitForReady();

    // Step 1: Create minimal contact
    await createContact(page, listPage, MINIMAL_CONTACT);
    await page.getByRole("button", { name: "Zurück" }).click();
    await expect(page).toHaveURL("/");
    await expect(listPage.contactRow(minimalDisplay)).toBeVisible();

    // Step 2: Create full contact
    await createContact(page, listPage, FULL_CONTACT);
    await page.getByRole("button", { name: "Zurück" }).click();
    await expect(page).toHaveURL("/");
    await expect(listPage.contactRow(fullDisplay)).toBeVisible();

    // Step 3: Soft-delete minimal contact
    await listPage.contactRow(minimalDisplay).click();
    await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
    await softDeleteCurrentContact(page, listPage);

    await expect(listPage.contactRow(minimalDisplay)).not.toBeVisible();
    await expect(listPage.contactRow(fullDisplay)).toBeVisible();

    // Step 4: Soft-delete full contact
    await listPage.contactRow(fullDisplay).click();
    await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
    await softDeleteCurrentContact(page, listPage);

    await expect(listPage.contactRow(minimalDisplay)).not.toBeVisible();
    await expect(listPage.contactRow(fullDisplay)).not.toBeVisible();

    // Step 5: Toggle "Ausgeblendete" view
    await listPage.waitForSyncSettled();
    await listPage.toggleShowDeleted();
    await expect(listPage.fab).not.toBeVisible();
    await expect(listPage.contactRow(minimalDisplay)).toBeVisible();
    await expect(listPage.contactRow(fullDisplay)).toBeVisible();

    // Step 6: Restore minimal contact
    await listPage.waitForSyncSettled();
    await listPage.restoreButtonByLabel(minimalDisplay).click();
    await expect(listPage.contactRow(minimalDisplay)).not.toBeVisible();

    // Switch back to active view
    await listPage.toggleShowDeleted();
    await expect(listPage.contactRow(minimalDisplay)).toBeVisible();
    await expect(listPage.contactRow(fullDisplay)).not.toBeVisible();

    // Step 7: Switch back to deleted view, permanently delete full contact
    await listPage.toggleShowDeleted();
    await expect(listPage.contactRow(fullDisplay)).toBeVisible();
    await listPage.waitForSyncSettled();
    await listPage.permanentDeleteButtonByLabel(fullDisplay).click();
    await expect(listPage.contactRow(fullDisplay)).not.toBeVisible();

    // Step 8: Cleanup — soft-delete restored minimal contact
    await listPage.toggleShowDeleted();
    await listPage.contactRow(minimalDisplay).click();
    await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
    await softDeleteCurrentContact(page, listPage);

    // Final cleanup: permanently delete from deleted view
    await listPage.toggleShowDeleted();
    await listPage.waitForSyncSettled();
    await listPage.permanentDeleteButtonByLabel(minimalDisplay).click();
    await expect(listPage.contactRow(minimalDisplay)).not.toBeVisible();
  });
});
