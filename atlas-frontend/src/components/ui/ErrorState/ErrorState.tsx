import { AlertCircle, RefreshCw } from "lucide-react";
import { Box, Button, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

/**
 * Estado de erro reutilizável para páginas que buscam dados via TanStack
 * Query. O botão "Tentar novamente" só aparece se `onRetry` for passado
 * (tipicamente o `refetch` do próprio hook de query — nenhuma lógica nova).
 */
export function ErrorState({
  message = "Não foi possível carregar os dados. Tente novamente em instantes.",
  onRetry,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        py: 6,
        px: 4,
        borderRadius: 3,
        border: "1px solid",
        borderColor: alpha(theme.palette.error.main, 0.3),
        bgcolor: alpha(theme.palette.error.main, 0.06),
      }}
    >
      <AlertCircle
        size={40}
        color={theme.palette.error.main}
      />

      <Typography
        variant="h6"
        fontWeight={700}
        color="error.dark"
        mt={2}
      >
        Algo deu errado
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        mt={0.5}
        mb={onRetry ? 3 : 0}
        maxWidth={420}
      >
        {message}
      </Typography>

      {onRetry && (
        <Button
          variant="outlined"
          color="error"
          size="small"
          startIcon={<RefreshCw size={16} />}
          onClick={onRetry}
        >
          Tentar novamente
        </Button>
      )}
    </Box>
  );
}
