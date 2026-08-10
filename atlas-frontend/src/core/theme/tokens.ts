export const tokens = {
  colors: {
    background: "#F8FAFC",
    surface: "#FFFFFF",

    primary: "#2563EB",
    primaryHover: "#1D4ED8",

    text: "#0F172A",
    textSecondary: "#64748B",

    border: "#E2E8F0",

    success: "#16A34A",
    warning: "#D97706",
    danger: "#DC2626",
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  shadow: {
    none: "none",
    card: "0 1px 2px rgba(15,23,42,.04)",
  },
} as const;