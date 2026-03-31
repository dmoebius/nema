import React, { useEffect, useState } from "react";
import { Snackbar, Alert } from "@mui/material";
import { useSyncStore } from "../../store/sync";
import { useContactsStore } from "../../store/contacts";

export const ErrorSnackbar: React.FC = () => {
  const syncError = useSyncStore((s) => s.hasError);
  const loadError = useContactsStore((s) => s.hasError);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (syncError || loadError) setOpen(true);
  }, [syncError, loadError]);

  return (
    <Snackbar
      open={open}
      autoHideDuration={5000}
      onClose={() => setOpen(false)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      sx={{ mb: 8 }}
    >
      <Alert severity="error" onClose={() => setOpen(false)} sx={{ width: "100%" }}>
        Fehler beim Laden.
      </Alert>
    </Snackbar>
  );
};
