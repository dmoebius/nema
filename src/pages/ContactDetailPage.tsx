import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Avatar,
  Chip,
  Stack,
  Card,
  CardContent,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Link,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import HomeIcon from "@mui/icons-material/Home";
import CakeIcon from "@mui/icons-material/Cake";
import BusinessIcon from "@mui/icons-material/Business";
import NotesIcon from "@mui/icons-material/Notes";
import GroupIcon from "@mui/icons-material/Group";
import PersonIcon from "@mui/icons-material/Person";
import { useContactsStore } from "../store/contacts";
import type { Contact } from "../types/contact";

// ── Helper functions (outside the component) ────────────────────────────────

function getInitials(firstName: string, lastName: string): string {
  return ((firstName?.[0] ?? "") + (lastName?.[0] ?? "")).toUpperCase() || "?";
}

const AVATAR_COLORS = [
  "#2d6a4f",
  "#52b788",
  "#1b4332",
  "#b5838d",
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
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// SVG noise texture as data URI for header atmosphere
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`;

const phoneTypeLabel: Record<string, string> = {
  mobile: "Mobil",
  home: "Privat",
  work: "Arbeit",
  other: "Sonstige",
};
const emailTypeLabel: Record<string, string> = {
  home: "Privat",
  work: "Arbeit",
  other: "Sonstige",
};
const addressTypeLabel: Record<string, string> = {
  home: "Privat",
  work: "Arbeit",
  other: "Sonstige",
};

// ── Downline section as separate component (rerender-no-inline-components) ──

interface DownlineSectionProps {
  contactId: string;
  contacts: Contact[];
  onNavigate: (id: string) => void;
}

const DownlineSection: React.FC<DownlineSectionProps> = ({ contactId, contacts, onNavigate }) => {
  const downline = contacts.filter((c) => c.sponsorId === contactId);
  if (downline.length === 0) return null;

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
          <GroupIcon color="primary" fontSize="small" />
          <Typography variant="subtitle2" color="primary" fontWeight={600}>
            Downline ({downline.length})
          </Typography>
        </Stack>
        <Stack gap={0.75}>
          {downline.map((c) => {
            const name = [c.firstName, c.lastName].join(" ");
            const color = getAvatarColor(name);
            return (
              <Box
                key={c.id}
                onClick={() => onNavigate(c.id)}
                sx={{
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: color,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    boxShadow: `0 1px 4px ${color}55`,
                  }}
                >
                  {getInitials(c.firstName, c.lastName)}
                </Avatar>
                <Typography variant="body2" color="primary" fontWeight={500}>
                  {c.firstName} {c.lastName}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
};

// ── Main component ───────────────────────────────────────────────────────────

export const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getContact, removeContact, contacts } = useContactsStore();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!id) return null;
  const contact = getContact(id);

  if (!contact) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">Kontakt nicht gefunden.</Typography>
        <Button onClick={() => navigate("/")} sx={{ mt: 2 }}>
          Zurück zur Liste
        </Button>
      </Box>
    );
  }

  const sponsor = contact.sponsorId ? contacts.find((c) => c.id === contact.sponsorId) : undefined;
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const initials = getInitials(contact.firstName, contact.lastName);
  const color = getAvatarColor(fullName);

  const handleDelete = async () => {
    await removeContact(contact.id); // IDB + store update; Supabase runs fire-and-forget inside
    navigate("/");
  };

  const formatBirthday = (d: string) => {
    try {
      return new Date(d + "T00:00:00").toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return d;
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", pb: 4 }}>
      {/* ── Header with avatar and noise overlay ── */}
      <Box
        sx={{
          position: "relative",
          background: `linear-gradient(150deg, ${color}e0 0%, ${color}88 60%, ${color}44 100%)`,
          py: 4,
          px: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage: NOISE_SVG,
            backgroundRepeat: "repeat",
            pointerEvents: "none",
          },
        }}
      >
        <Avatar
          src={contact.avatarUrl}
          sx={{
            width: 92,
            height: 92,
            bgcolor: color,
            fontSize: "2rem",
            fontWeight: 700,
            border: "3px solid rgba(255,255,255,0.8)",
            boxShadow: `0 4px 20px rgba(0,0,0,0.18)`,
            zIndex: 1,
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ textAlign: "center", zIndex: 1 }}>
          <Typography
            variant="h5"
            sx={{
              fontFamily: '"DM Serif Display", serif',
              fontWeight: 400,
              color: "#1a2e23",
              textShadow: "0 1px 2px rgba(255,255,255,0.4)",
              lineHeight: 1.2,
            }}
          >
            {contact.firstName} {contact.lastName}
          </Typography>
          {contact.company && (
            <Typography variant="body2" sx={{ color: "#2d5a40", mt: 0.25, fontWeight: 500 }}>
              {contact.company}
            </Typography>
          )}
        </Box>
        {contact.tags.length > 0 && (
          <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={0.5} sx={{ zIndex: 1 }}>
            {contact.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.75)",
                  color: "#1b4332",
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  backdropFilter: "blur(4px)",
                }}
              />
            ))}
          </Stack>
        )}
        <Stack direction="row" gap={1} sx={{ zIndex: 1 }}>
          <Tooltip title="Bearbeiten">
            <IconButton
              onClick={() => navigate(`/contacts/${contact.id}/edit`)}
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(4px)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
              }}
            >
              <EditIcon color="primary" fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Löschen">
            <IconButton
              aria-label="Kontakt löschen"
              onClick={() => setDeleteOpen(true)}
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.8)",
                backdropFilter: "blur(4px)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.95)" },
              }}
            >
              <DeleteIcon color="error" fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── Content area ── */}
      <Box sx={{ px: 2, pt: 2 }}>
        {contact.phones.length > 0 && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                <PhoneIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" color="primary">
                  Telefon
                </Typography>
              </Stack>
              {contact.phones.map((p, i) => (
                <React.Fragment key={p.id}>
                  {i > 0 && <Divider sx={{ my: 1 }} />}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Link href={`tel:${p.number}`} underline="hover" color="inherit">
                      <Typography variant="body1" fontWeight={500}>
                        {p.number}
                      </Typography>
                    </Link>
                    <Typography variant="caption" color="text.secondary">
                      {phoneTypeLabel[p.type] ?? p.type}
                    </Typography>
                  </Box>
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        )}

        {contact.emails.length > 0 && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                <EmailIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" color="primary">
                  E-Mail
                </Typography>
              </Stack>
              {contact.emails.map((e, i) => (
                <React.Fragment key={e.id}>
                  {i > 0 && <Divider sx={{ my: 1 }} />}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Link href={`mailto:${e.address}`} underline="hover" color="inherit">
                      <Typography variant="body1" fontWeight={500}>
                        {e.address}
                      </Typography>
                    </Link>
                    <Typography variant="caption" color="text.secondary">
                      {emailTypeLabel[e.type] ?? e.type}
                    </Typography>
                  </Box>
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        )}

        {contact.addresses.length > 0 && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                <HomeIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" color="primary">
                  Adresse
                </Typography>
              </Stack>
              {contact.addresses.map((a, i) => (
                <React.Fragment key={a.id}>
                  {i > 0 && <Divider sx={{ my: 1 }} />}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Box>
                      {a.street && <Typography variant="body2">{a.street}</Typography>}
                      {(a.zip || a.city) && (
                        <Typography variant="body2">{[a.zip, a.city].filter(Boolean).join(" ")}</Typography>
                      )}
                      {a.country && <Typography variant="body2">{a.country}</Typography>}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {addressTypeLabel[a.type] ?? a.type}
                    </Typography>
                  </Box>
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        )}

        {contact.birthday && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                <CakeIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" color="primary">
                  Geburtstag
                </Typography>
              </Stack>
              <Typography variant="body1" fontWeight={500}>
                {formatBirthday(contact.birthday)}
              </Typography>
            </CardContent>
          </Card>
        )}

        {contact.company && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                <BusinessIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" color="primary">
                  Firma
                </Typography>
              </Stack>
              <Typography variant="body1" fontWeight={500}>
                {contact.company}
              </Typography>
            </CardContent>
          </Card>
        )}

        {sponsor && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                <PersonIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" color="primary">
                  Gesponsert von
                </Typography>
              </Stack>
              <Box
                component="span"
                onClick={() => navigate(`/contacts/${sponsor.id}`)}
                sx={{
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 30,
                    height: 30,
                    bgcolor: getAvatarColor([sponsor.firstName, sponsor.lastName].join(" ")),
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  {getInitials(sponsor.firstName, sponsor.lastName)}
                </Avatar>
                <Typography variant="body1" color="primary" fontWeight={500}>
                  {sponsor.firstName} {sponsor.lastName}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Downline as separate component (rerender-no-inline-components) */}
        <DownlineSection contactId={contact.id} contacts={contacts} onNavigate={(id) => navigate(`/contacts/${id}`)} />

        {contact.note && (
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                <NotesIcon color="primary" fontSize="small" />
                <Typography variant="subtitle2" color="primary">
                  Notiz
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                {contact.note}
              </Typography>
            </CardContent>
          </Card>
        )}

        <Typography
          variant="caption"
          color="text.disabled"
          display="block"
          textAlign="right"
          sx={{ mt: 1 }}
          data-testid="contact-updated-at"
          data-value={contact.updatedAt}
        >
          Zuletzt geändert: {new Date(contact.updatedAt).toLocaleString("de-DE")}
        </Typography>
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle sx={{ fontFamily: '"DM Serif Display", serif', fontWeight: 400 }}>Kontakt ausblenden?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Kontakt {fullName} ausblenden? Er kann unter „Ausgeblendete“ wiederhergestellt werden.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Abbrechen</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Löschen
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
