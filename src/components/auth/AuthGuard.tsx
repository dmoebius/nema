import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuthStore } from "../../store/auth";
import { supabase } from "../../lib/supabase";
import { LoginPage } from "./LoginPage";

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { session, loading, initialize } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Redirect to reset-password page when user clicks a password reset link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

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
