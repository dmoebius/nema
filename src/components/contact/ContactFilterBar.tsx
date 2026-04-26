import { useState } from "react";
import { Box, TextField, InputAdornment, Typography, Chip, Stack, Paper } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

interface ContactFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedTags: string[];
  allTags: string[];
  onToggleTag: (tag: string) => void;
  showDeleted: boolean;
  onToggleShowDeleted: () => void;
}

export function ContactFilterBar({
  searchQuery,
  onSearchChange,
  selectedTags,
  allTags,
  onToggleTag,
  showDeleted,
  onToggleShowDeleted,
}: ContactFilterBarProps) {
  const [showTagFilter, setShowTagFilter] = useState(false);

  return (
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
      {!showDeleted && (
        <TextField
          fullWidth
          size="small"
          placeholder="Suchen…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "primary.light", fontSize: "1.1rem" }} />
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
      )}
      {!showDeleted && allTags.length > 0 && (
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
            <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mt: 0.75 }}>
              {allTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant={selectedTags.includes(tag) ? "filled" : "outlined"}
                  color={selectedTags.includes(tag) ? "primary" : "default"}
                  onClick={() => onToggleTag(tag)}
                  sx={{ fontWeight: 500 }}
                />
              ))}
            </Stack>
          )}
        </Box>
      )}

      <Box
        sx={{
          mt: !showDeleted && allTags.length > 0 ? 0.75 : 0,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Chip
          icon={<VisibilityOffIcon sx={{ fontSize: "0.9rem !important" }} />}
          label="Ausgeblendete"
          size="small"
          variant={showDeleted ? "filled" : "outlined"}
          onClick={onToggleShowDeleted}
          sx={{
            fontWeight: 500,
            fontSize: "0.72rem",
            opacity: showDeleted ? 1 : 0.65,
          }}
        />
      </Box>
    </Paper>
  );
}
