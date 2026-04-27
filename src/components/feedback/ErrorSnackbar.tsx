import React from "react";
import { Snackbar, Alert } from "@mui/material";
import { useSyncStore } from "../../store/sync";
import { useContactsStore } from "../../store/contacts";

export const ErrorSnackbar: React.FC = () => {
  const clearSyncError = useSyncStore((s) => s.clearError);
  const clearLoadError = useContactsStore((s) => s.clearError);
  const syncError = useSyncStore((s) => s.hasError);
  const loadError = useContactsStore((s) => s.hasError);
  const open = syncError || loadError;

  const handleClose = () => {
    clearSyncError();
    clearLoadError();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ mb: 8 }}
    >
      <Alert severity="error" onClose={handleClose} sx={{ width: "100%" }}>
        Fehler beim Laden.
      </Alert>
    </Snackbar>
  );
};
