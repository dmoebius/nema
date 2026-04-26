import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Contact } from "../types/contact";
import { mergeContacts, toTimestamped } from "./merge";
import type { TimestampedContact } from "./merge";
import { getAllContacts, getContact, saveContact, deleteContact, getSyncBase, setSyncBase, deleteSyncBase } from "../db";

// Maps Supabase row (snake_case) to local Contact (camelCase)
function rowToContact(row: Record<string, unknown>): TimestampedContact {
  return {
    id: row.id as string,
    firstName: (row.first_name as string) ?? "",
    lastName: (row.last_name as string) ?? "",
    company: row.company as string | undefined,
    birthday: row.birthday as string | undefined,
    note: row.note as string | undefined,
    avatarUrl: row.avatar_url as string | undefined,
    sponsorId: row.sponsor_id as string | undefined,
    deviceContactId: row.device_contact_id as string | undefined,
    deletedAt: row.deleted_at as string | undefined,
    phones: (row.phones as Contact["phones"]) ?? [],
    emails: (row.emails as Contact["emails"]) ?? [],
    addresses: (row.addresses as Contact["addresses"]) ?? [],
    tags: (row.tags as string[]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    fieldTimestamps: (row.field_timestamps as TimestampedContact["fieldTimestamps"]) ?? {},
  };
}

// Maps local Contact (camelCase) to Supabase row (snake_case)
function contactToRow(contact: TimestampedContact, userId: string): Record<string, unknown> {
  return {
    id: contact.id,
    user_id: userId,
    first_name: contact.firstName,
    last_name: contact.lastName,
    company: contact.company ?? null,
    birthday: contact.birthday ?? null,
    note: contact.note ?? null,
    avatar_url: contact.avatarUrl ?? null,
    sponsor_id: contact.sponsorId ?? null,
    device_contact_id: contact.deviceContactId ?? null,
    deleted_at: contact.deletedAt ?? null,
    phones: contact.phones,
    emails: contact.emails,
    addresses: contact.addresses,
    tags: contact.tags,
    field_timestamps: contact.fieldTimestamps,
    updated_at: contact.updatedAt,
  };
}

// Fetch all active (non-deleted) contacts for the current user from Supabase
export async function pullContacts(): Promise<TimestampedContact[]> {
  const { data, error } = await supabase.from("contacts").select("*").is("deleted_at", null).order("last_name");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => rowToContact(row as Record<string, unknown>));
}

// Push a single contact to Supabase (upsert)
export async function pushContact(contact: TimestampedContact, userId: string): Promise<void> {
  const { error } = await supabase.from("contacts").upsert(contactToRow(contact, userId));

  if (error) throw new Error(error.message);
}

// Soft-delete a contact in Supabase (sets deleted_at + updated_at instead of hard delete).
// Pass the same `updatedAt` timestamp used for the local IDB write so that the stale-event
// guard in subscribeToChanges (local.updatedAt >= remote.updatedAt) works correctly: without
// a matching updated_at bump the Realtime UPDATE would look equal-age to the local record
// and any subsequent late-arriving creation event could overwrite the soft-delete.
export async function removeContactFromSupabase(id: string, updatedAt?: string): Promise<void> {
  const now = updatedAt ?? new Date().toISOString();
  const { error } = await supabase
    .from("contacts")
    .update({ deleted_at: now, updated_at: now })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// Hard-delete a contact from Supabase (permanent, used only in "Ausgeblendete" view)
export async function hardDeleteContactFromSupabase(id: string): Promise<void> {
  const { error } = await supabase.from("contacts").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// Full sync: pull remote (active only), merge with local active contacts, push conflicts resolved
export async function syncAll(userId: string): Promise<void> {
  // Use getAllContacts (active + soft-deleted) so that a locally soft-deleted contact
  // is never overwritten by the still-active remote version when the Supabase UPDATE
  // from removeContactFromSupabase is still in-flight (fire-and-forget race).
  const [remoteContacts, allLocalContacts] = await Promise.all([pullContacts(), getAllContacts()]);

  // Active-only map for merge logic; full map for soft-delete guard
  const localActiveContacts = allLocalContacts.filter((c) => !c.deletedAt);
  const localMap = new Map(localActiveContacts.map((c) => [c.id, c]));
  const allLocalMap = new Map(allLocalContacts.map((c) => [c.id, c]));
  const remoteMap = new Map(remoteContacts.map((c) => [c.id, c]));
  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

  for (const id of allIds) {
    const local = localMap.get(id);
    const remote = remoteMap.get(id);

    if (remote && !local) {
      // Contact is active on remote but not in local active map.
      // Check if it exists locally as soft-deleted: if so, and the local updatedAt is
      // >= remote updatedAt, the local soft-delete is at least as new as the remote
      // active version — respect it and skip the overwrite.
      // This fixes the race where removeContactFromSupabase (fire-and-forget) hasn't
      // reached Supabase yet when syncAll runs.
      const localAll = allLocalMap.get(id);
      if (localAll?.deletedAt && localAll.updatedAt >= remote.updatedAt) {
        continue;
      }
      // Genuinely only on remote (or remote is newer than local soft-delete) → save locally
      await saveContact(remote);
      await setSyncBase(remote);
      continue;
    }

    if (local && !remote) {
      // Only local → push to remote
      const timestamped = toTimestamped(local);
      await pushContact(timestamped, userId);
      await setSyncBase(timestamped);
      continue;
    }

    if (local && remote) {
      const base = (await getSyncBase(id)) ?? toTimestamped(remote);
      const localTimestamped = toTimestamped(local);

      // Skip if nothing changed
      if (local.updatedAt === remote.updatedAt) {
        await setSyncBase(remote);
        continue;
      }

      const merged = mergeContacts(base, localTimestamped, remote);
      await saveContact(merged);
      await pushContact(merged, userId);
      await setSyncBase(merged);
    }
  }
}

// Subscribe to realtime changes for the current user
export function subscribeToChanges(
  userId: string,
  onUpdate: (contact: TimestampedContact) => void,
  onDelete: (id: string) => void,
): RealtimeChannel {
  return supabase
    .channel("contacts-changes")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "contacts",
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id: string }).id;
          await deleteContact(id);
          await deleteSyncBase(id);
          onDelete(id);
        } else {
          const contact = rowToContact(payload.new as Record<string, unknown>);
          // Skip stale Realtime events: if a newer local version exists, don't overwrite it.
          // This prevents late-arriving events (e.g. from contact creation) from undoing
          // local soft-deletes or other writes that are ahead of the remote state.
          const local = await getContact(contact.id);
          if (local && local.updatedAt >= contact.updatedAt) {
            // Local is at least as new — skip; prevents a late-arriving Realtime event
            // (e.g. the creation INSERT arriving after a soft-delete) from overwriting
            // local state that is equal-age or newer (same-millisecond race on fast CI).
            return;
          }
          await saveContact(contact);
          await setSyncBase(contact);
          onUpdate(contact);
        }
      },
    )
    .subscribe();
}
