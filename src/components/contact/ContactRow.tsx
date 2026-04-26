import { Box, ListItemButton, ListItemAvatar, ListItemText, Avatar, Typography, Chip, Stack } from "@mui/material";
import type { Contact } from "../../types/contact";

export function getInitials(contact: Contact): string {
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

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface ContactRowProps {
  contact: Contact;
  onClick: () => void;
}

export function ContactRow({ contact, onClick }: ContactRowProps) {
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
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
              <Typography variant="body2" color="text.secondary" component="span" display="block">
                {contact.company}
              </Typography>
            )}
            {contact.phones[0] && (
              <Typography variant="body2" color="text.secondary" component="span" display="block">
                {contact.phones[0].number}
              </Typography>
            )}
            {contact.tags.length > 0 && (
              <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.5 }} component="span">
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
}
