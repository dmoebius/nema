import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box, List, Fab, Typography, CircularProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PersonIcon from "@mui/icons-material/Person";
import { useContactsStore } from "../store/contacts";
import type { Contact } from "../types/contact";
import { ContactRow } from "../components/contact/ContactRow";
import { DeletedContactRow } from "../components/contact/DeletedContactRow";
import { ContactFilterBar } from "../components/contact/ContactFilterBar";

export function ContactListPage() {
  const navigate = useNavigate();
  const {
    loading,
    contacts: rawContacts,
    getFilteredContacts,
    getAllTags,
    searchQuery,
    setSearchQuery,
    selectedTags,
    toggleTag,
    showDeleted,
    setShowDeleted,
    restoreContact,
    permanentlyDeleteContact,
  } = useContactsStore();

  // rawContacts + showDeleted as dependency ensures recompute on store changes
  const contacts = useMemo(
    () => getFilteredContacts(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawContacts, searchQuery, selectedTags, showDeleted],
  );
  const allTags = useMemo(
    () => getAllTags(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rawContacts],
  );

  // Group contacts by first letter of last name
  const { grouped, letters } = useMemo(() => {
    const grouped: Record<string, Contact[]> = {};
    for (const c of contacts) {
      const letter = (c.lastName?.[0] ?? c.firstName?.[0] ?? "#").toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(c);
    }
    const letters = Object.keys(grouped).sort((a, b) => a.localeCompare(b, "de"));
    return { grouped, letters };
  }, [contacts]);

  return (
    <Box
      sx={{
        position: "relative",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ContactFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTags={selectedTags}
        allTags={allTags}
        onToggleTag={toggleTag}
        showDeleted={showDeleted}
        onToggleShowDeleted={() => setShowDeleted(!showDeleted)}
      />

      {/* Contact list */}
      <Box sx={{ flexGrow: 1, overflow: "auto", px: 1, py: 1 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress color="primary" aria-label="Kontakte werden geladen" />
          </Box>
        ) : contacts.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 8, px: 4 }}>
            <PersonIcon sx={{ fontSize: 64, color: "primary.light", opacity: 0.4, mb: 2 }} />
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ fontFamily: '"DM Serif Display", serif', fontWeight: 400 }}
            >
              {showDeleted
                ? "Keine ausgeblendeten Kontakte"
                : searchQuery || selectedTags.length > 0
                  ? "Keine Kontakte gefunden"
                  : "Noch keine Kontakte?"}
            </Typography>
            {!showDeleted && !searchQuery && selectedTags.length === 0 && (
              <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                Tippe auf + um den ersten Kontakt anzulegen
              </Typography>
            )}
          </Box>
        ) : (
          <List disablePadding>
            {letters.map((letter) => (
              <React.Fragment key={letter}>
                {/* Letter group header */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    px: 2,
                    pt: 1.5,
                    pb: 0.25,
                  }}
                >
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      bgcolor: showDeleted ? "action.disabled" : "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mr: 1,
                      flexShrink: 0,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "white",
                        lineHeight: 1,
                        fontFamily: '"DM Sans", sans-serif',
                      }}
                    >
                      {letter}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, height: "1px", bgcolor: "divider" }} />
                </Box>

                {grouped[letter].map((contact) =>
                  showDeleted ? (
                    <DeletedContactRow
                      key={contact.id}
                      contact={contact}
                      onRestore={() => restoreContact(contact.id)}
                      onPermanentDelete={() => permanentlyDeleteContact(contact.id)}
                    />
                  ) : (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      onClick={() => navigate(`/contacts/${contact.id}`)}
                    />
                  ),
                )}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* FAB — hidden in deleted view */}
      {!showDeleted && (
        <Fab
          color="primary"
          aria-label="Kontakt hinzufügen"
          onClick={() => navigate("/contacts/new")}
          sx={{ position: "fixed", bottom: 24, right: 24 }}
        >
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
}
