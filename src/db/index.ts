import { openDB } from "idb";
import type { DBSchema, IDBPDatabase } from "idb";
import type { Contact } from "../types/contact";
import type { TimestampedContact } from "../sync/merge";

interface NemaDB extends DBSchema {
  contacts: {
    key: string;
    value: Contact;
    indexes: {
      "by-lastName": string;
      "by-firstName": string;
      "by-company": string;
      "by-tags": string[];
      "by-updatedAt": string;
      "by-deviceContactId": string;
      "by-deletedAt": string;
    };
  };
  // Stores the last known synced version of each contact (used as merge base)
  syncBase: {
    key: string;
    value: TimestampedContact;
  };
}

const DB_NAME = "nema-db";
const DB_VERSION = 3;

let dbInstance: IDBPDatabase<NemaDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<NemaDB>> {
  if (dbInstance) return dbInstance;
  dbInstance = await openDB<NemaDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, tx) {
      if (oldVersion < 1) {
        const store = db.createObjectStore("contacts", { keyPath: "id" });
        store.createIndex("by-lastName", "lastName");
        store.createIndex("by-firstName", "firstName");
        store.createIndex("by-company", "company");
        store.createIndex("by-tags", "tags", { multiEntry: true });
        store.createIndex("by-updatedAt", "updatedAt");
      }
      if (oldVersion < 2) {
        db.createObjectStore("syncBase", { keyPath: "id" });
      }
      if (oldVersion < 3) {
        const contactStore = tx.objectStore("contacts");
        contactStore.createIndex("by-deviceContactId", "deviceContactId", { unique: false });
        contactStore.createIndex("by-deletedAt", "deletedAt", { unique: false });
      }
    },
  });
  return dbInstance;
}

export async function getAllContacts(): Promise<Contact[]> {
  const db = await getDB();
  return db.getAll("contacts");
}

export async function getContact(id: string): Promise<Contact | undefined> {
  const db = await getDB();
  return db.get("contacts", id);
}

export async function saveContact(contact: Contact): Promise<void> {
  const db = await getDB();
  await db.put("contacts", contact);
}

export async function deleteContact(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("contacts", id);
}

export async function softDeleteContact(id: string): Promise<string | undefined> {
  const db = await getDB();
  const contact = await db.get("contacts", id);
  if (!contact) return undefined;
  const now = new Date().toISOString();
  await db.put("contacts", { ...contact, deletedAt: now, updatedAt: now });
  return now;
}

export async function getActiveContacts(): Promise<Contact[]> {
  const contacts = await getAllContacts();
  return contacts.filter((c) => !c.deletedAt);
}

export async function getDeletedContacts(): Promise<Contact[]> {
  const contacts = await getAllContacts();
  return contacts.filter((c) => !!c.deletedAt);
}

export async function getAllTags(): Promise<string[]> {
  const contacts = await getAllContacts();
  const tagSet = new Set<string>();
  contacts.forEach((c) => c.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

// Sync base: last known synced state per contact (3-way merge anchor)
export async function getSyncBase(id: string): Promise<TimestampedContact | undefined> {
  const db = await getDB();
  return db.get("syncBase", id);
}

export async function setSyncBase(contact: TimestampedContact): Promise<void> {
  const db = await getDB();
  await db.put("syncBase", contact);
}

export async function deleteSyncBase(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("syncBase", id);
}

// Wipe all local data (contacts + sync base) — called on logout
export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear("contacts");
  await db.clear("syncBase");
}
