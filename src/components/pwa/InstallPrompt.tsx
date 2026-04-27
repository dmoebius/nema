import React, { useEffect, useState } from "react";
import { Snackbar, Button, Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import GetAppIcon from "@mui/icons-material/GetApp";

const DISMISSED_KEY = "nema_install_dismissed_until";
const DISMISS_DAYS = 7;

// Detects iOS Safari (PWA install not supported via beforeinstallprompt)
function isIosSafari(): boolean {
  const ua = navigator.userAgent;
  const isIos = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios/i.test(ua);
  return isIos && isSafari;
}

// Detects if app is already running as installed PWA
function isInstalled(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

function isDismissed(): boolean {
  const until = localStorage.getItem(DISMISSED_KEY);
  if (!until) return false;
  return Date.now() < Number(until);
}

function dismiss() {
  const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
  localStorage.setItem(DISMISSED_KEY, String(until));
}

// BeforeInstallPromptEvent is not in standard lib types
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const InstallPrompt: React.FC = () => {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  // Derive initial iOS state eagerly — these checks are pure reads of navigator/window
  const iosReady = !isInstalled() && !isDismissed() && isIosSafari();
  const [showIosHint] = useState(iosReady);
  const [open, setOpen] = useState(iosReady);

  useEffect(() => {
    if (isInstalled() || isDismissed() || isIosSafari()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
      setOpen(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!promptEvent) return;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "accepted") {
      setOpen(false);
    }
  };

  const handleDismiss = () => {
    dismiss();
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Snackbar open={open} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={{ mb: 8 }}>
      <Box
        sx={{
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          p: 2,
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          maxWidth: 360,
          boxShadow: 4,
        }}
      >
        <GetAppIcon color="primary" sx={{ mt: 0.25, flexShrink: 0 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            nema installieren
          </Typography>
          {showIosHint ? (
            <Typography variant="body2" color="text.secondary">
              Tippe auf{" "}
              <Box component="span" fontWeight={700}>
                ↑
              </Box>{" "}
              und dann auf <em>„Zum Home-Bildschirm"</em>.
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Füge nema zum Home-Bildschirm hinzu für schnellen Zugriff.
              </Typography>
              <Button size="small" variant="contained" onClick={handleInstall} sx={{ borderRadius: 1.5 }}>
                Installieren
              </Button>
            </>
          )}
        </Box>
        <IconButton size="small" onClick={handleDismiss} sx={{ mt: -0.5 }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Snackbar>
  );
};
