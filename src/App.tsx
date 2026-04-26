import React, { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import { Layout } from "./components/Layout";
import { ContactListPage } from "./pages/ContactListPage";
import { ContactDetailPage } from "./pages/ContactDetailPage";
import { ContactEditPage } from "./pages/ContactEditPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AuthGuard } from "./components/auth/AuthGuard";
import { ResetPasswordPage } from "./components/auth/ResetPasswordPage";
import { useAuthStore } from "./store/auth";
import { useSyncStore } from "./store/sync";
import { useContactsStore } from "./store/contacts";
import { subscribeToChanges } from "./sync/supabaseSync";
import { InstallPrompt } from "./components/pwa/InstallPrompt";
import { ErrorSnackbar } from "./components/feedback/ErrorSnackbar";
import { useContactsPermission } from "./hooks/useContactsPermission";

// Wrapper with key reset: remounts ContactEditPage when the ID changes
// (rerender-derived-state-no-effect: no useEffect needed for form initialization)
const ContactEditPageKeyed: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  return <ContactEditPage key={id ?? "new"} />;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<Layout title="nema" />}>
        <Route path="/" element={<ContactListPage />} />
      </Route>
      <Route element={<Layout title="Kontakt" showBack />}>
        <Route path="/contacts/new" element={<ContactEditPageKeyed />} />
        <Route path="/contacts/:id" element={<ContactDetailPage />} />
        <Route path="/contacts/:id/edit" element={<ContactEditPageKeyed />} />
      </Route>
      <Route element={<Layout title="Einstellungen" showBack />}>
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const { user } = useAuthStore();
  const { sync } = useSyncStore();
  const { loadContacts } = useContactsStore();
  useContactsPermission(!!user); // Only request after successful login

  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!user) return;

    const initialize = async () => {
      // Load from local IndexedDB immediately (fast, offline-capable)
      await loadContacts();

      // Sync with Supabase — loadContacts is called internally after sync completes
      await sync(user.id);

      // Subscribe to realtime changes only after initial load + sync
      channelRef.current = subscribeToChanges(
        user.id,
        () => loadContacts(),
        () => loadContacts(),
      );
    };

    initialize();

    return () => {
      channelRef.current?.unsubscribe();
      channelRef.current = null;
    };
    // loadContacts and sync are stable Zustand references — omitted intentionally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthGuard>
        <AppRoutes />
        <InstallPrompt />
        <ErrorSnackbar />
      </AuthGuard>
    </ThemeProvider>
  );
};

export default App;
