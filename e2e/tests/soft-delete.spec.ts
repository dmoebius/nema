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
  // After soft-delete: redirected back to list, wait for UI to settle
  await expect(page).toHaveURL("/");
  await listPage.waitForStable();
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

    // Navigate back and verify visible in active list
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

    // Minimal contact must be gone from active list
    await expect(listPage.contactRow(minimalDisplay)).not.toBeVisible();
    // Full contact still in active list
    await expect(listPage.contactRow(fullDisplay)).toBeVisible();

    // Step 4: Soft-delete full contact
    await listPage.contactRow(fullDisplay).click();
    await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
    await softDeleteCurrentContact(page, listPage);

    // Both contacts must be gone from active list
    await expect(listPage.contactRow(minimalDisplay)).not.toBeVisible();
    await expect(listPage.contactRow(fullDisplay)).not.toBeVisible();

    // Step 5: Toggle "Ausgeblendete" view
    await listPage.toggleShowDeleted();

    // FAB must be hidden in deleted view
    await expect(listPage.fab).not.toBeVisible();

    // Both soft-deleted contacts must appear in deleted view
    await expect(listPage.contactRow(minimalDisplay)).toBeVisible();
    await expect(listPage.contactRow(fullDisplay)).toBeVisible();

    // Step 6: Restore minimal contact
    await listPage.restoreButtonByLabel(minimalDisplay).click();
    // After restore, minimal contact disappears from deleted view
    await expect(listPage.contactRow(minimalDisplay)).not.toBeVisible();

    // Switch back to active view and verify minimal is restored
    await listPage.toggleShowDeleted();
    await expect(listPage.contactRow(minimalDisplay)).toBeVisible();
    // Full contact must NOT be in active view (still deleted)
    await expect(listPage.contactRow(fullDisplay)).not.toBeVisible();

    // Step 7: Switch back to deleted view, permanently delete full contact
    await listPage.toggleShowDeleted();
    await expect(listPage.contactRow(fullDisplay)).toBeVisible();

    await listPage.permanentDeleteButtonByLabel(fullDisplay).click();
    // After permanent delete: full contact gone from deleted view
    await expect(listPage.contactRow(fullDisplay)).not.toBeVisible();

    // Step 8: Cleanup — soft-delete restored minimal contact
    await listPage.toggleShowDeleted();
    await listPage.contactRow(minimalDisplay).click();
    await expect(page).toHaveURL(/\/contacts\/[^/]+$/);
    await softDeleteCurrentContact(page, listPage);

    // Final cleanup: permanently delete from deleted view
    await listPage.toggleShowDeleted();
    await listPage.permanentDeleteButtonByLabel(minimalDisplay).click();
    await expect(listPage.contactRow(minimalDisplay)).not.toBeVisible();
  });
});
