import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Contacts } from "@capacitor-community/contacts";

export type PermissionStatus = "granted" | "denied" | "prompt" | "unavailable";

/**
 * Requests READ_CONTACTS + WRITE_CONTACTS permission on native Android/iOS.
 * On web, returns "unavailable" immediately (no-op).
 */
export function useContactsPermission(enabled = true): PermissionStatus {
  const [status, setStatus] = useState<PermissionStatus>(() =>
    Capacitor.isNativePlatform() ? "prompt" : "unavailable"
  );

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !enabled) return;

    const requestPermission = async () => {
      try {
        const result = await Contacts.requestPermissions();
        const granted =
          result.contacts === "granted";
        setStatus(granted ? "granted" : "denied");
      } catch {
        setStatus("denied");
      }
    };

    requestPermission();
  }, []);

  return status;
}
