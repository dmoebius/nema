import { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import { useAuthStore } from "../../store/auth";

export function LoginPage() {
  const { sendMagicLink, loading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [snackOpen, setSnackOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendMagicLink(email);
    // Always show confirmation regardless of outcome — prevents enumeration attacks
    setSnackOpen(true);
    setEmail("");
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        px: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 400,
          borderRadius: 3,
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontFamily: '"DM Serif Display", serif',
            fontWeight: 400,
            mb: 1,
            color: "primary.main",
          }}
        >
          nema
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Gib deine E-Mail-Adresse ein — wir schicken dir einen Login-Link.
        </Typography>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            type="email"
            label="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading || !email}
            sx={{ borderRadius: 2 }}
          >
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Login-Link anfordern"
            )}
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
          data-testid="magic-link-snackbar"
        >
          Falls diese E-Mail-Adresse berechtigt ist, erhältst du gleich einen Login-Link. Schau in dein Postfach.
        </Alert>
      </Snackbar>
    </Box>
  );
}
