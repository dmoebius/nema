import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppBar, Toolbar, Typography, Box, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

interface LayoutProps {
  title?: string;
  showBack?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  title = "nema",
  showBack = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isRoot = location.pathname === "/";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          {(!isRoot || showBack) && (
            <IconButton
              edge="start"
              color="inherit"
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
};
