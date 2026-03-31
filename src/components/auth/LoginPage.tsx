import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import { useAuthStore } from "../../store/auth";

export const LoginPage: React.FC = () => {
  const { sendMagicLink, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    await sendMagicLink(email);
    if (!useAuthStore.getState().error) {
      setSent(true);
    }
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

        {sent ? (
          <Alert severity="success" icon={<EmailIcon />}>
            Link verschickt! Schau in dein Postfach und klicke auf den Link.
          </Alert>
        ) : (
          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={clearError}>
                {error === "Signups not allowed for otp"
                  ? "Diese E-Mail-Adresse ist nicht berechtigt."
                  : error}
              </Alert>
            )}
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
        )}
      </Paper>
    </Box>
  );
};
