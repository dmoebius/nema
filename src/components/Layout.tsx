import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box, IconButton, CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SettingsIcon from "@mui/icons-material/Settings";
import { useSyncStore } from "../store/sync";
import { AppMenu } from "./layout/AppMenu";

interface LayoutProps {
  title?: string;
  showBack?: boolean;
}

export function Layout({ title = "nema", showBack = false }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { status: syncStatus } = useSyncStore();
  const isRoot = location.pathname === "/";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          {(!isRoot || showBack) && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="Zurück"
              onClick={() => navigate(-1)}
              sx={{ mr: 1, opacity: 0.9 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontFamily: '"DM Serif Display", serif',
              fontWeight: 400,
              letterSpacing: "0.01em",
              fontSize: isRoot ? "1.35rem" : "1.1rem",
            }}
          >
            {title}
          </Typography>
          {syncStatus === "syncing" && (
            <CircularProgress
              size={18}
              thickness={5}
              color="inherit"
              sx={{ opacity: 0.7, mr: 1 }}
              aria-label="Synchronisierung läuft"
            />
          )}
          {isRoot && (
            <IconButton
              color="inherit"
              aria-label="Einstellungen"
              onClick={() => navigate("/settings")}
              sx={{ opacity: 0.9 }}
            >
              <SettingsIcon />
            </IconButton>
          )}
          <AppMenu />
        </Toolbar>
      </AppBar>
      <Box
        component="main"
        sx={{ flexGrow: 1, overflow: "auto", bgcolor: "background.default" }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
