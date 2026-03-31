import React, { useRef, useState } from "react";
import { Avatar, Box, IconButton, CircularProgress } from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";

interface AvatarPickerProps {
  currentUrl?: string;
  initials?: string;
  color?: string;
  uploading?: boolean;
  onFileSelected: (file: File) => void;
  onDelete?: () => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  currentUrl,
  initials,
  color,
  uploading = false,
  onFileSelected,
  onDelete,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onFileSelected(file);
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const displayUrl = preview ?? currentUrl;

  return (
    <Box sx={{ position: "relative", width: 96, height: 96 }}>
      <Avatar
        src={displayUrl}
        sx={{
          width: 96,
          height: 96,
          bgcolor: color ?? "primary.main",
          fontSize: "2rem",
          fontWeight: 700,
          cursor: "pointer",
          boxShadow: 3,
        }}
        onClick={() => inputRef.current?.click()}
      >
        {!displayUrl && (initials || <PersonIcon sx={{ fontSize: 48 }} />)}
      </Avatar>

      {/* Loading overlay */}
      {uploading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            bgcolor: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress size={32} sx={{ color: "white" }} />
        </Box>
      )}

      {/* Camera button */}
      {!uploading && (
        <IconButton
          size="small"
          onClick={() => inputRef.current?.click()}
          sx={{
            position: "absolute",
            bottom: 0,
            right: 0,
            bgcolor: "primary.main",
            color: "white",
            "&:hover": { bgcolor: "primary.dark" },
            width: 28,
            height: 28,
          }}
        >
          <CameraAltIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}

      {/* Delete button */}
      {!uploading && (displayUrl) && onDelete && (
        <IconButton
          size="small"
          data-testid="delete-avatar-btn"
          onClick={onDelete}
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            bgcolor: "error.main",
            color: "white",
            "&:hover": { bgcolor: "error.dark" },
            width: 28,
            height: 28,
          }}
        >
          <DeleteIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </Box>
  );
};
