import { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Box, Typography, Button, Paper, Divider, Alert, CircularProgress } from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import { useSyncStore } from "../store/sync";
import { useContactsStore } from "../store/contacts";
import { getActiveContacts, saveContact } from "../db";
import { syncWithDeviceContacts } from "../sync/deviceSync";

export function SettingsPage() {
  const { lastSyncAt } = useSyncStore();
  const { loadContacts } = useContactsStore();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<"success" | "error" | null>(null);

  const isNative = Capacitor.isNativePlatform();

  const handleDeviceSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const activeContacts = await getActiveContacts();
      const updated = await syncWithDeviceContacts(activeContacts);
      for (const c of updated) {
        await saveContact(c);
      }
      await loadContacts();
      setSyncResult("success");
    } catch {
      setSyncResult("error");
    } finally {
      setSyncing(false);
    }
  };

  const formatSyncTime = (iso: string | null): string => {
    if (!iso) return "Noch nicht synchronisiert";
    return new Date(iso).toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box sx={{ p: 2, maxWidth: 480, mx: "auto" }}>
      <Paper elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Box sx={{ px: 2.5, py: 2 }}>
          <Typography
            variant="subtitle2"
            color="text.secondary"
            sx={{ mb: 1.5, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", fontSize: "0.7rem" }}
          >
            Synchronisierung
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Letzte Synchronisierung:
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {formatSyncTime(lastSyncAt)}
            </Typography>
          </Box>
        </Box>

        {isNative && (
          <>
            <Divider />
            <Box sx={{ px: 2.5, py: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <PhoneAndroidIcon sx={{ fontSize: "1.1rem", color: "primary.main" }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  Telefonbuch
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Kontakte mit dem Telefonbuch dieses Geräts abgleichen.
              </Typography>

              <Button
                variant="contained"
                startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
                onClick={handleDeviceSync}
                disabled={syncing}
                disableElevation
              >
                Telefonbuch synchronisieren
              </Button>

              {syncResult === "success" && (
                <Alert severity="success" sx={{ mt: 1.5 }}>
                  Telefonbuch erfolgreich synchronisiert.
                </Alert>
              )}
              {syncResult === "error" && (
                <Alert severity="error" sx={{ mt: 1.5 }}>
                  Synchronisierung fehlgeschlagen. Berechtigungen prüfen.
                </Alert>
              )}
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}
