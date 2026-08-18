import { useState } from "react";
import { Boxes, PackageMinus, PackagePlus } from "lucide-react";
import { Alert, Box, Button, Pagination, Skeleton, Snackbar, Stack, Typography } from "@mui/material";

import { ErrorState } from "../../../components/ui/ErrorState";
import { MetricCard } from "../../../components/ui/MetricCard";
import { tokens } from "../../../core/theme/tokens";
import { StockHistoryTable } from "../components/StockHistoryTable";
import { StockMovementDialog } from "../components/StockMovementDialog";
import type { MovementMode } from "../components/StockMovementDialog";
import { useStockHistory } from "../hooks/useStockHistory";

interface FeedbackState {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

const INITIAL_FEEDBACK: FeedbackState = {
  open: false,
  message: "",
  severity: "success",
};

export function EstoquePage() {
  const [page, setPage] = useState(0);
  const [movementMode, setMovementMode] = useState<MovementMode | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(INITIAL_FEEDBACK);

  const { data, isLoading, isError, refetch } = useStockHistory(page);

  function openMovementDialog(mode: MovementMode) {
    setMovementMode(mode);
  }

  function handleDialogSuccess(mode: MovementMode) {
    setFeedback({
      open: true,
      message: mode === "entry" ? "Entrada registrada com sucesso." : "Saída registrada com sucesso.",
      severity: "success",
    });
  }

  function handleDialogError(message: string) {
    setFeedback({ open: true, message, severity: "error" });
  }

  function closeFeedback(_event?: unknown, reason?: string) {
    // O Snackbar do MUI chama onClose também para "clickaway" (clique fora
    // dele) — sem esse guard, qualquer clique no Dialog (que fica acima)
    // fecha o Snackbar quase instantaneamente, antes de ficar visível.
    if (reason === "clickaway") {
      return;
    }

    setFeedback((current) => ({ ...current, open: false }));
  }

  // O Pagination do MUI é 1-indexado; a API é 0-indexada. O Math.max evita
  // o aviso de `count` inválido quando ainda não há nenhuma movimentação.
  const totalPages = Math.max(data?.totalPages ?? 1, 1);

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.5}
        mb={3}
      >
        <Typography variant="h3">
          Estoque
        </Typography>

        <Stack
          direction="row"
          spacing={1.5}
        >
          <Button
            variant="outlined"
            color="success"
            startIcon={<PackagePlus size={18} />}
            onClick={() => openMovementDialog("entry")}
            sx={{ flex: { xs: 1, sm: "initial" } }}
          >
            Entrada
          </Button>

          <Button
            variant="contained"
            color="error"
            startIcon={<PackageMinus size={18} />}
            onClick={() => openMovementDialog("exit")}
            sx={{ flex: { xs: 1, sm: "initial" } }}
          >
            Saída
          </Button>
        </Stack>
      </Stack>

      {isLoading && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ maxWidth: 280 }}>
            <Skeleton
              variant="rounded"
              height={104}
              sx={{ borderRadius: 3 }}
            />
          </Box>

          <Stack
            spacing={1.5}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 3,
              p: 3,
            }}
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rounded"
                height={36}
              />
            ))}
          </Stack>
        </Box>
      )}

      {isError && (
        <ErrorState
          message="Não foi possível carregar o histórico de estoque. Tente novamente em instantes."
          onRetry={refetch}
        />
      )}

      {data && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ maxWidth: 280 }}>
            <MetricCard
              title="Movimentações"
              value={String(data.totalElements)}
              icon={<Boxes size={24} />}
            />
          </Box>

          {data.content.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                py: 8,
                px: 4,
                borderRadius: 3,
                border: "1px dashed",
                borderColor: "divider",
                bgcolor: "background.default",
              }}
            >
              <Boxes
                size={48}
                color={tokens.colors.textSecondary}
              />

              <Typography
                variant="h6"
                fontWeight={700}
                mt={2}
              >
                Nenhuma movimentação registrada
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                mt={0.5}
                maxWidth={360}
              >
                Registre uma entrada ou saída para acompanhar o histórico aqui.
              </Typography>
            </Box>
          ) : (
            <>
              <StockHistoryTable movements={data.content} />

              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={(_event, newPage) => setPage(newPage - 1)}
                color="primary"
                sx={{ alignSelf: "flex-end" }}
              />
            </>
          )}
        </Box>
      )}

      <StockMovementDialog
        key={movementMode ?? "closed"}
        open={movementMode !== null}
        mode={movementMode ?? "entry"}
        onClose={() => setMovementMode(null)}
        onSuccess={() => {
          if (movementMode) {
            handleDialogSuccess(movementMode);
          }
        }}
        onError={handleDialogError}
      />

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={closeFeedback}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={feedback.severity}
          onClose={closeFeedback}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
