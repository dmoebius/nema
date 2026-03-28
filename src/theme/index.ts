import { createTheme } from "@mui/material/styles";

// Warm forest green palette
const FOREST_GREEN = "#2d6a4f";
const FOREST_GREEN_LIGHT = "#52b788";
const FOREST_GREEN_DARK = "#1b4332";
const ROSE_ACCENT = "#b5838d";
const BG_CREAM = "#f8f5f0";
const BG_PAPER = "#ffffff";

const theme = createTheme({
  palette: {
    primary: {
      main: FOREST_GREEN,
      light: FOREST_GREEN_LIGHT,
      dark: FOREST_GREEN_DARK,
      contrastText: "#ffffff",
    },
    secondary: {
      main: ROSE_ACCENT,
      contrastText: "#ffffff",
    },
    background: {
      default: BG_CREAM,
      paper: BG_PAPER,
    },
    text: {
      primary: "#1a2e23",
      secondary: "#4a6358",
    },
    divider: "rgba(45, 106, 79, 0.12)",
  },
  typography: {
    fontFamily: '"DM Sans", "Helvetica", "Arial", sans-serif',
    h4: { fontFamily: '"DM Serif Display", serif', fontWeight: 400 },
    h5: { fontFamily: '"DM Serif Display", serif', fontWeight: 400 },
    h6: { fontFamily: '"DM Serif Display", serif', fontWeight: 400 },
    subtitle1: { fontWeight: 500 },
    subtitle2: { fontWeight: 600, letterSpacing: "0.02em" },
    button: { fontWeight: 600, letterSpacing: "0.03em" },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, ${FOREST_GREEN} 0%, ${FOREST_GREEN_DARK} 100%)`,
          boxShadow: `0 2px 12px rgba(27, 67, 50, 0.25)`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          marginBottom: 1,
          transition: "background-color 0.15s ease",
          "&:hover": {
            backgroundColor: "rgba(45, 106, 79, 0.06)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "none",
          border: `1px solid rgba(45, 106, 79, 0.15)`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          fontWeight: 500,
        },
        colorPrimary: {
          backgroundColor: FOREST_GREEN,
          color: "#ffffff",
        },
        outlinedPrimary: {
          borderColor: FOREST_GREEN,
          color: FOREST_GREEN,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: `0 4px 16px rgba(27, 67, 50, 0.35)`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          background: `linear-gradient(135deg, ${FOREST_GREEN} 0%, ${FOREST_GREEN_DARK} 100%)`,
          boxShadow: `0 2px 8px rgba(27, 67, 50, 0.3)`,
          "&:hover": {
            background: `linear-gradient(135deg, ${FOREST_GREEN_LIGHT} 0%, ${FOREST_GREEN} 100%)`,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: FOREST_GREEN_LIGHT,
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: FOREST_GREEN,
            },
          },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontFamily: '"DM Sans", sans-serif',
          fontWeight: 700,
        },
      },
    },
  },
});

export default theme;
