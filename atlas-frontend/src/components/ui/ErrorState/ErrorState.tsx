import { AlertCircle, RefreshCw } from "lucide-react";
import { Box, Button, Typography } from "@mui/material";

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
        border: "1px solid #FECACA",
        bgcolor: "#FEF2F2",
      }}
    >
      <AlertCircle
        size={40}
        color="#DC2626"
      />

      <Typography
        variant="h6"
        fontWeight={700}
        color="#991B1B"
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
