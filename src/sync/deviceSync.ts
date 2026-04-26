import { Capacitor } from "@capacitor/core";
import { Contacts } from "@capacitor-community/contacts";
import type { PhoneType as CapPhoneType, EmailType as CapEmailType } from "@capacitor-community/contacts";
import type { Contact, Phone, Email } from "../types/contact";
import { v4 as uuidv4 } from "uuid";

// Normalize a name to a canonical key for matching
function normalizeName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim().toLowerCase();
}

// Map a Capacitor phone type to nema PhoneType
function mapPhoneType(type: CapPhoneType | undefined): Phone["type"] {
  if (!type) return "mobile";
  const t = type.toLowerCase();
  if (t.includes("mobile") || t.includes("cell")) return "mobile";
  if (t.includes("home")) return "home";
  if (t.includes("work")) return "work";
  return "other";
}

// Map a Capacitor email type to nema EmailType
function mapEmailType(type: CapEmailType | undefined): Email["type"] {
  if (!type) return "home";
  const t = type.toLowerCase();
  if (t.includes("home")) return "home";
  if (t.includes("work")) return "work";
  return "other";
}

// Map nema phone type to Capacitor PhoneType enum value
function toCapPhoneType(type: Phone["type"]): CapPhoneType {
  const map: Record<Phone["type"], CapPhoneType> = {
    mobile: "mobile" as CapPhoneType,
    home: "home" as CapPhoneType,
    work: "work" as CapPhoneType,
    other: "other" as CapPhoneType,
  };
  return map[type];
}

// Map nema email type to Capacitor EmailType enum value
function toCapEmailType(type: Email["type"]): CapEmailType {
  const map: Record<Email["type"], CapEmailType> = {
    home: "home" as CapEmailType,
    work: "work" as CapEmailType,
    other: "other" as CapEmailType,
  };
  return map[type];
}

/**
 * Bidirectional sync between nema contacts and the native device address book.
 * Only runs on native platforms. Soft-deleted contacts are skipped entirely.
 *
 * @param nemaContacts - Current active (non-deleted) nema contacts
 * @returns Updated contacts array (with new deviceContactId assignments and/or new imports)
 */
export async function syncWithDeviceContacts(nemaContacts: Contact[]): Promise<Contact[]> {
  if (!Capacitor.isNativePlatform()) return nemaContacts;

  // Read all device contacts
  const { contacts: deviceContacts } = await Contacts.getContacts({
    projection: {
      name: true,
      phones: true,
      emails: true,
      organization: true,
    },
  });

  // Build lookup maps for nema contacts
  // Active contacts only (soft-deleted are excluded from input)
  const byDeviceId = new Map<string, Contact>();
  const byNormalizedName = new Map<string, Contact[]>();

  for (const c of nemaContacts) {
    if (c.deviceContactId) {
      byDeviceId.set(c.deviceContactId, c);
    }
    const key = normalizeName(c.firstName, c.lastName);
    if (!byNormalizedName.has(key)) byNormalizedName.set(key, []);
    byNormalizedName.get(key)!.push(c);
  }

  // Track which nema contacts were updated
  const updatedContacts = new Map<string, Contact>(nemaContacts.map((c) => [c.id, { ...c }]));

  // Contacts to add as new nema entries (duplicate name matches)
  const toAdd: Contact[] = [];

  for (const dc of deviceContacts) {
    const dcId = dc.contactId;
    if (!dcId) continue;

    const dcFirstName = dc.name?.given ?? "";
    const dcLastName = dc.name?.family ?? "";

    // Step 1: match by deviceContactId
    const existingByDeviceId = byDeviceId.get(dcId);
    if (existingByDeviceId) {
      // Write nema data back to device (delete old + create new with same fields)
      await writeNemaContactToDevice(existingByDeviceId, dcId);
      continue;
    }

    // Step 2: match by normalized name
    const nameKey = normalizeName(dcFirstName, dcLastName);
    const nameMatches = byNormalizedName.get(nameKey) ?? [];

    if (nameMatches.length === 1) {
      // Unique name match: link and fill empty nema fields additively
      const nemaContact = updatedContacts.get(nameMatches[0].id)!;
      const updated: Contact = {
        ...nemaContact,
        deviceContactId: dcId,
        // Additive fill: only set if empty in nema
        phones:
          nemaContact.phones.length > 0
            ? nemaContact.phones
            : (dc.phones ?? []).map((p) => ({
                id: uuidv4(),
                type: mapPhoneType(p.type),
                number: p.number ?? "",
              })),
        emails:
          nemaContact.emails.length > 0
            ? nemaContact.emails
            : (dc.emails ?? []).map((e) => ({
                id: uuidv4(),
                type: mapEmailType(e.type),
                address: e.address ?? "",
              })),
        company: nemaContact.company ?? dc.organization?.company ?? undefined,
        updatedAt: new Date().toISOString(),
      };
      updatedContacts.set(nemaContact.id, updated);
      // Also write back nema fields to device
      await writeNemaContactToDevice(updated, dcId);
    } else if (nameMatches.length > 1) {
      // Duplicate name match: import as new nema contact, no auto-link
      const now = new Date().toISOString();
      const newContact: Contact = {
        id: uuidv4(),
        firstName: dcFirstName,
        lastName: dcLastName,
        company: dc.organization?.company ?? undefined,
        phones: (dc.phones ?? []).map((p) => ({
          id: uuidv4(),
          type: mapPhoneType(p.type),
          number: p.number ?? "",
        })),
        emails: (dc.emails ?? []).map((e) => ({
          id: uuidv4(),
          type: mapEmailType(e.type),
          address: e.address ?? "",
        })),
        addresses: [],
        tags: [],
        deviceContactId: dcId,
        createdAt: now,
        updatedAt: now,
      };
      toAdd.push(newContact);
    }
    // nameMatches.length === 0: device-only contact, not imported automatically
  }

  const result = Array.from(updatedContacts.values());
  return [...result, ...toAdd];
}

/**
 * Write nema-managed fields back to a device contact.
 * The Capacitor Contacts plugin does not support in-place update — we delete
 * the existing entry and recreate it. Only nema-managed fields are written:
 * firstName, lastName, phones, emails, company.
 */
async function writeNemaContactToDevice(contact: Contact, deviceContactId: string): Promise<void> {
  // Delete the old device contact entry first
  await Contacts.deleteContact({ contactId: deviceContactId });

  // Recreate with nema-managed fields only
  await Contacts.createContact({
    contact: {
      name: {
        given: contact.firstName,
        family: contact.lastName,
      },
      phones: contact.phones.map((p) => ({
        type: toCapPhoneType(p.type),
        number: p.number,
        isPrimary: false,
      })),
      emails: contact.emails.map((e) => ({
        type: toCapEmailType(e.type),
        address: e.address,
        isPrimary: false,
      })),
      organization: contact.company ? { company: contact.company, jobTitle: null, department: null } : undefined,
    },
  });
}
