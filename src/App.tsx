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

    // Then sync with Supabase and reload to pick up remote changes
    sync(user.id).then(() => loadContacts());

    // Realtime subscription for live updates from other devices
    const channel = subscribeToChanges(
      user.id,
      (_updated: TimestampedContact) => loadContacts(),
      (_deletedId: string) => loadContacts(),
    );

    return () => {
      channel.unsubscribe();
    };
  }, [user, sync, loadContacts]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthGuard>
        <AppRoutes />
      </AuthGuard>
    </ThemeProvider>
  );
};

export default App;
