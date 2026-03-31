import type { Contact } from "../types/contact";

/**
 * Represents a contact with per-attribute timestamps for conflict resolution.
 * Each attribute tracks when it was last modified independently.
 */
export interface TimestampedContact extends Contact {
  fieldTimestamps: Partial<Record<keyof Contact, string>>;
}

/**
 * Performs a 3-way merge of two contact versions against a common base.
 * Resolution strategy: last-write-wins per attribute, based on fieldTimestamps.
 *
 * @param base   - Last known synced version (common ancestor)
 * @param local  - Local version with pending changes
 * @param remote - Remote version from Supabase
 * @returns Merged contact with updated fieldTimestamps
 */
export function mergeContacts(
  base: TimestampedContact,
  local: TimestampedContact,
  remote: TimestampedContact,
): TimestampedContact {
  const mergedTimestamps: Partial<Record<keyof Contact, string>> = {};
  const result = { ...base } as TimestampedContact;

  const fields = new Set([
    ...Object.keys(local),
    ...Object.keys(remote),
  ]) as Set<keyof Contact>;

  // Reserved fields that are never merged per-attribute
  const skipFields = new Set<keyof Contact>(["id", "createdAt"]);

  for (const field of fields) {
    if (skipFields.has(field)) continue;

    // Fall back to base timestamp if field was not explicitly changed
    const baseTs = base.fieldTimestamps?.[field] ?? base.updatedAt;
    const localTs = local.fieldTimestamps?.[field] ?? baseTs;
    const remoteTs = remote.fieldTimestamps?.[field] ?? baseTs;

    if (localTs >= remoteTs) {
      // Local wins: more recent or equal timestamp
      (result as Record<string, unknown>)[field] = local[field];
      mergedTimestamps[field] = localTs;
    } else {
      // Remote wins: more recent timestamp
      (result as Record<string, unknown>)[field] = remote[field];
      mergedTimestamps[field] = remoteTs;
    }
  }

  result.fieldTimestamps = mergedTimestamps;
  result.updatedAt = new Date().toISOString();

  return result;
}

/**
 * Wraps a plain Contact into a TimestampedContact.
 * All field timestamps are initialized to updatedAt.
 */
export function toTimestamped(contact: Contact): TimestampedContact {
  const timestamps: Partial<Record<keyof Contact, string>> = {};
  for (const key of Object.keys(contact) as (keyof Contact)[]) {
    timestamps[key] = contact.updatedAt;
  }
  return { ...contact, fieldTimestamps: timestamps };
}
