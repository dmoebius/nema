import { Box, Avatar, Typography, IconButton, Tooltip } from "@mui/material";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import type { Contact } from "../../types/contact";
import { getInitials, getAvatarColor } from "./ContactRow";

interface DeletedContactRowProps {
  contact: Contact;
  onRestore: () => void;
  onPermanentDelete: () => void;
}

export function DeletedContactRow({ contact, onRestore, onPermanentDelete }: DeletedContactRowProps) {
  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
  const initials = getInitials(contact);
  const color = getAvatarColor(fullName);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        borderRadius: 2,
        mx: 0.5,
        py: 0.5,
        px: 1,
        opacity: 0.7,
      }}
    >
      <Box sx={{ mr: 1.5, flexShrink: 0 }}>
        <Avatar
          src={contact.avatarUrl}
          sx={{
            bgcolor: color,
            fontWeight: 700,
            fontSize: "0.95rem",
            filter: "grayscale(0.6)",
            width: 40,
            height: 40,
          }}
        >
          {initials}
        </Avatar>
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <Typography variant="body1" fontWeight={500} color="text.secondary" noWrap>
          {contact.lastName}
          {contact.firstName && contact.lastName ? ", " : ""}
          {contact.firstName}
        </Typography>
        {contact.company && (
          <Typography variant="body2" color="text.disabled" noWrap>
            {contact.company}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
        <Tooltip title="Wiederherstellen">
          <IconButton
            size="small"
            color="primary"
            aria-label="Kontakt wiederherstellen"
            onClick={onRestore}
          >
            <RestoreFromTrashIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Endgültig löschen">
          <IconButton
            size="small"
            color="error"
            aria-label="Kontakt endgültig löschen"
            onClick={onPermanentDelete}
          >
            <DeleteForeverIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
