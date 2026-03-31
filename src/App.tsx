import React, { useEffect } from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import { Layout } from "./components/Layout";
import { ContactListPage } from "./pages/ContactListPage";
import { ContactDetailPage } from "./pages/ContactDetailPage";
import { ContactEditPage } from "./pages/ContactEditPage";
import { AuthGuard } from "./components/auth/AuthGuard";
import { useAuthStore } from "./store/auth";
import { useSyncStore } from "./store/sync";
import { useContactsStore } from "./store/contacts";
import { subscribeToChanges } from "./sync/supabaseSync";
import type { TimestampedContact } from "./sync/merge";
import { InstallPrompt } from "./components/pwa/InstallPrompt";
import { ErrorSnackbar } from "./components/feedback/ErrorSnackbar";

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
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const { user } = useAuthStore();
  const { sync } = useSyncStore();
  const { loadContacts } = useContactsStore();

  useEffect(() => {
    if (!user) return;

    // Load from local IndexedDB immediately (fast, offline-capable)
    loadContacts();

    // Sync with Supabase — loadContacts is called internally after sync completes
    sync(user.id);

    // Realtime subscription for live updates from other devices
    const channel = subscribeToChanges(
      user.id,
      (_updated: TimestampedContact) => loadContacts(),
      (_deletedId: string) => loadContacts(),
    );

    return () => {
      channel.unsubscribe();
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
