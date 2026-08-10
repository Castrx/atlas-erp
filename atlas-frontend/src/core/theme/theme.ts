import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  cssVariables: true,

  palette: {
    mode: "light",

    primary: {
      main: "#2563EB",
    },

    background: {
      default: "#F8FAFC",
      paper: "#FFFFFF",
    },

    text: {
      primary: "#0F172A",
      secondary: "#64748B",
    },

    divider: "#E2E8F0",
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: "Inter, sans-serif",

    h1: {
      fontSize: "2rem",
      fontWeight: 700,
    },

    h2: {
      fontSize: "1.5rem",
      fontWeight: 700,
    },

    h3: {
      fontSize: "1.25rem",
      fontWeight: 600,
    },

    body1: {
      fontSize: "0.95rem",
    },

    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
});