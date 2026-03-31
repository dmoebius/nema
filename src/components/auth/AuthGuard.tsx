import React, { useEffect } from "react";
import { Box, CircularProgress } from "@mui/material";
import { useAuthStore } from "../../store/auth";
import { LoginPage } from "./LoginPage";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { session, loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return <>{children}</>;
};
