/**
 * Tokens de identidade do Atlas ERP — mesma linguagem de marca do Atlas AI
 * (produto irmão desta suíte): base "papel" quente e acento verde-petróleo,
 * em vez do azul padrão de template. `theme.ts` é a fonte primária para
 * componentes MUI (via `sx`, ex.: `bgcolor: "background.default"`); estes
 * tokens existem para o que fica fora do sistema de tema do MUI (ex.: cores
 * de SVG do Recharts em SalesChart).
 */
export const tokens = {
  colors: {
    background: "#F4F2ED",
    surface: "#FFFFFF",

    primary: "#146B5C",
    primaryHover: "#0E5548",

    text: "#1C2333",
    textSecondary: "#656B7D",

    border: "#DDD6C7",

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
    card: "0 1px 2px rgba(28, 35, 51, .05)",
  },
} as const;
