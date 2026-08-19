import { alpha, createTheme } from "@mui/material/styles";

import { tokens } from "./tokens";

export const theme = createTheme({
  cssVariables: true,

  palette: {
    mode: "light",

    primary: {
      main: tokens.colors.primary,
      dark: tokens.colors.primaryHover,
    },

    background: {
      default: tokens.colors.background,
      paper: tokens.colors.surface,
    },

    text: {
      primary: tokens.colors.text,
      secondary: tokens.colors.textSecondary,
    },

    divider: tokens.colors.border,

    // Wired explicitamente para os valores de tokens.ts — sem isto, `<Chip
    // color="success">`/`<Alert severity="warning">` etc. caem nos verde/
    // âmbar/vermelho padrão do MUI em vez dos tons definidos para o produto.
    success: {
      main: tokens.colors.success,
    },
    warning: {
      main: tokens.colors.warning,
    },
    error: {
      main: tokens.colors.danger,
    },
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: "Inter, sans-serif",

    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },

    h2: {
      fontSize: "2rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },

    // Título de página (Dashboard, Produtos, Vendas...). Antes era menor
    // que o h6 dos cards, achatando a hierarquia entre "página" e "seção";
    // agora fica claramente acima de qualquer título de card.
    h3: {
      fontSize: "1.875rem",
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },

    // Único uso atual é o wordmark "Atlas ERP" da Sidebar — a serifada fica
    // reservada à marca, nunca a dados/tabelas/formulários.
    h5: {
      fontFamily: '"Fraunces", "Iowan Old Style", Georgia, serif',
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

  components: {
    // Cabeçalho de tabela com hierarquia própria (peso, tamanho, cor) e
    // hover de linha no corpo — aplicado uma vez aqui para cascatear em
    // todas as tabelas (Produtos, Clientes, Vendas, Estoque) sem tocar em
    // cada uma delas.
    MuiTableHead: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.default,

          "& .MuiTableCell-root": {
            fontSize: "0.75rem",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: theme.palette.text.secondary,
          },
        }),
      },
    },

    MuiTableBody: {
      styleOverrides: {
        root: ({ theme }) => ({
          "& .MuiTableRow-root:hover": {
            backgroundColor: alpha(theme.palette.primary.main, 0.05),
          },
        }),
      },
    },
  },
});
