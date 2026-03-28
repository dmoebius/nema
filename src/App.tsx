import React from "react";
import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import { Layout } from "./components/Layout";
import { ContactListPage } from "./pages/ContactListPage";
import { ContactDetailPage } from "./pages/ContactDetailPage";
import { ContactEditPage } from "./pages/ContactEditPage";

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
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppRoutes />
    </ThemeProvider>
  );
};

export default App;
