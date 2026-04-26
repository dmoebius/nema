import { useState } from "react";
import { Box, Button, TextField, Typography, Paper, Snackbar, Alert, Link } from "@mui/material";
import { useAuthStore } from "../../store/auth";

type View = "login" | "forgot";

export function LoginPage() {
  const { signIn, resetPassword } = useAuthStore();
  const [view, setView] = useState<View>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      // AuthGuard will redirect automatically on session change
    } catch {
      setError("E-Mail oder Passwort falsch.");
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await resetPassword(email);
      setSuccessMsg("Falls diese E-Mail bekannt ist, erhältst du gleich einen Reset-Link.");
      setEmail("");
      setView("login");
    } catch {
      setError("Fehler beim Versenden. Bitte versuche es später erneut.");
    } finally {
      setBusy(false);
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

        {view === "login" ? (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Melde dich mit deiner E-Mail-Adresse und deinem Passwort an.
            </Typography>
            <Box component="form" onSubmit={handleLogin}>
              <TextField
                fullWidth
                type="email"
                label="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
                inputProps={{ "data-testid": "email-input" }}
              />
              <TextField
                fullWidth
                type="password"
                label="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 2 }}
                inputProps={{ "data-testid": "password-input" }}
              />
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={!email || !password || busy}
                sx={{ borderRadius: 2, mb: 2 }}
                data-testid="login-button"
              >
                Anmelden
              </Button>
              <Box sx={{ textAlign: "center" }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => {
                    setView("forgot");
                    setError(null);
                  }}
                >
                  Passwort vergessen?
                </Link>
              </Box>
            </Box>
          </>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Gib deine E-Mail-Adresse ein — wir schicken dir einen Link zum Zurücksetzen.
            </Typography>
            <Box component="form" onSubmit={handleForgot}>
              <TextField
                fullWidth
                type="email"
                label="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 2 }}
              />
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={!email || busy}
                sx={{ borderRadius: 2, mb: 2 }}
              >
                Reset-Link anfordern
              </Button>
              <Box sx={{ textAlign: "center" }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => {
                    setView("login");
                    setError(null);
                  }}
                >
                  Zurück zum Login
                </Link>
              </Box>
            </Box>
          </>
        )}
      </Paper>

      <Snackbar
        open={!!successMsg}
        autoHideDuration={8000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setSuccessMsg(null)} severity="success" variant="filled" sx={{ width: "100%" }}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
