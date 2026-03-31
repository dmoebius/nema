import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Fab,
  TextField,
  InputAdornment,
  Typography,
  Chip,
  Stack,
  CircularProgress,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import { useContactsStore } from "../store/contacts";
import type { Contact } from "../types/contact";

// Static helper functions outside the component (rendering-hoist-jsx)
function getInitials(contact: Contact): string {
  const f = contact.firstName?.[0] ?? "";
  const l = contact.lastName?.[0] ?? "";
  return (f + l).toUpperCase() || "?";
}

const AVATAR_COLORS = [
  "#2d6a4f",
  "#52b788",
  "#1b4332",
  "#b5838d",
  "#6d6875",
  "#457b9d",
  "#1d3557",
  "#e76f51",
  "#264653",
  "#2a9d8f",
  "#e9c46a",
  "#f4a261",
  "#a8dadc",
  "#606c38",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Extracted as separate component (rerender-no-inline-components)
interface ContactRowProps {
  contact: Contact;
  onClick: () => void;
}

const ContactRow: React.FC<ContactRowProps> = ({ contact, onClick }) => {
  const fullName = [contact.firstName, contact.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = getInitials(contact);
  const color = getAvatarColor(fullName);

  return (
    <ListItemButton onClick={onClick} sx={{ borderRadius: 2, mx: 0.5, py: 1 }}>
      <ListItemAvatar>
        <Avatar
          src={contact.avatarUrl}
          sx={{
            bgcolor: color,
            fontWeight: 700,
            fontSize: "0.95rem",
            boxShadow: `0 2px 8px ${color}55`,
          }}
        >
          {initials}
        </Avatar>
      </ListItemAvatar>
      <ListItemText
        primary={
          <Typography variant="body1" fontWeight={500} color="text.primary">
            {contact.lastName}
            {contact.firstName && contact.lastName ? ", " : ""}
            {contact.firstName}
          </Typography>
        }
        secondary={
          <Box component="span">
            {contact.company && (
              <Typography
                variant="body2"
                color="text.secondary"
                component="span"
                display="block"
              >
                {contact.company}
              </Typography>
            )}
            {contact.phones[0] && (
              <Typography
                variant="body2"
                color="text.secondary"
                component="span"
                display="block"
              >
                {contact.phones[0].number}
              </Typography>
            )}
            {contact.tags.length > 0 && (
              <Stack
                direction="row"
                gap={0.5}
                flexWrap="wrap"
                sx={{ mt: 0.5 }}
                component="span"
              >
                {contact.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    color="primary"
                    variant="filled"
                    sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600 }}
                  />
                ))}
              </Stack>
            )}
          </Box>
        }
      />
    </ListItemButton>
  );
};

export const ContactListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    loading,
    loadContacts,
    getFilteredContacts,
    getAllTags,
    searchQuery,
    setSearchQuery,
    selectedTags,
    toggleTag,
  } = useContactsStore();

  const [showTagFilter, setShowTagFilter] = useState(false);

  // Loading is handled centrally in App.tsx after auth + sync

  // useMemo prevents unnecessary recomputation on unrelated re-renders
  const contacts = useMemo(
    () => getFilteredContacts(),
    [getFilteredContacts, searchQuery, selectedTags],
  );
  const allTags = useMemo(() => getAllTags(), [getAllTags, contacts]);

  // Group contacts by first letter of last name
  const { grouped, letters } = useMemo(() => {
    const grouped: Record<string, Contact[]> = {};
    for (const c of contacts) {
      const letter = (c.lastName?.[0] ?? c.firstName?.[0] ?? "#").toUpperCase();
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(c);
    }
    const letters = Object.keys(grouped).sort((a, b) =>
      a.localeCompare(b, "de"),
    );
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
      {/* Search bar */}
      <Paper
        elevation={0}
        square
        sx={{
          px: 2,
          pt: 2,
          pb: 1.5,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Kontakte durchsuchen…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{ color: "primary.light", fontSize: "1.1rem" }}
                />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: allTags.length > 0 ? 1 : 0,
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              bgcolor: "background.default",
            },
          }}
        />
        {allTags.length > 0 && (
          <Box>
            <Typography
              variant="caption"
              sx={{
                cursor: "pointer",
                userSelect: "none",
                color: "primary.main",
                fontWeight: 600,
                letterSpacing: "0.03em",
              }}
              onClick={() => setShowTagFilter((v) => !v)}
            >
              {showTagFilter ? "▲ Tags ausblenden" : "▼ Nach Tags filtern"}
            </Typography>
            {showTagFilter && (
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={0.5}
                sx={{ mt: 0.75 }}
              >
                {allTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant={selectedTags.includes(tag) ? "filled" : "outlined"}
                    color={selectedTags.includes(tag) ? "primary" : "default"}
                    onClick={() => toggleTag(tag)}
                    sx={{ fontWeight: 500 }}
                  />
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Paper>

      {/* Contact list */}
      <Box sx={{ flexGrow: 1, overflow: "auto", px: 1, py: 1 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
            <CircularProgress color="primary" />
          </Box>
        ) : contacts.length === 0 ? (
          <Box sx={{ textAlign: "center", mt: 8, px: 4 }}>
            <PersonIcon
              sx={{ fontSize: 64, color: "primary.light", opacity: 0.4, mb: 2 }}
            />
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ fontFamily: '"DM Serif Display", serif', fontWeight: 400 }}
            >
              {searchQuery || selectedTags.length > 0
                ? "Keine Kontakte gefunden"
                : "Noch keine Kontakte?"}
            </Typography>
            {!searchQuery && selectedTags.length === 0 && (
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
                      bgcolor: "primary.main",
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

                {grouped[letter].map((contact) => (
                  <ContactRow
                    key={contact.id}
                    contact={contact}
                    onClick={() => navigate(`/contacts/${contact.id}`)}
                  />
                ))}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* FAB */}
      <Fab
        color="primary"
        aria-label="Kontakt hinzufügen"
        onClick={() => navigate("/contacts/new")}
        sx={{ position: "fixed", bottom: 24, right: 24 }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};
