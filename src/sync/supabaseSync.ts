import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Contact } from "../types/contact";
import { mergeContacts, toTimestamped } from "./merge";
import type { TimestampedContact } from "./merge";
import {
  getActiveContacts,
  saveContact,
  deleteContact,
  getSyncBase,
  setSyncBase,
  deleteSyncBase,
} from "../db";

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
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .is("deleted_at", null)
    .order("last_name");

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => rowToContact(row as Record<string, unknown>));
}

// Push a single contact to Supabase (upsert)
export async function pushContact(contact: TimestampedContact, userId: string): Promise<void> {
  const { error } = await supabase
    .from("contacts")
    .upsert(contactToRow(contact, userId));

  if (error) throw new Error(error.message);
}

// Soft-delete a contact in Supabase (sets deleted_at instead of hard delete)
export async function removeContactFromSupabase(id: string): Promise<void> {
  const { error } = await supabase
    .from("contacts")
    .update({ deleted_at: new Date().toISOString() })
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
  const [remoteContacts, localContacts] = await Promise.all([
    pullContacts(),
    getActiveContacts(),
  ]);

  const localMap = new Map(localContacts.map((c) => [c.id, c]));
  const remoteMap = new Map(remoteContacts.map((c) => [c.id, c]));
  const allIds = new Set([...localMap.keys(), ...remoteMap.keys()]);

  for (const id of allIds) {
    const local = localMap.get(id);
    const remote = remoteMap.get(id);

    if (remote && !local) {
      // Only on remote → save locally
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
          await saveContact(contact);
          await setSyncBase(contact);
          onUpdate(contact);
        }
      },
    )
    .subscribe();
}
