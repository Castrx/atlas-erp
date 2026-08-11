import { useState } from "react";
import axios from "axios";
import { Plus, Receipt } from "lucide-react";
import { Alert, Box, Button, Skeleton, Snackbar, Stack, Typography } from "@mui/material";

import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { ErrorState } from "../../../components/ui/ErrorState";
import { MetricCard } from "../../../components/ui/MetricCard";
import { useAuth } from "../../../core/auth";
import { SalesTable } from "../components/SalesTable";
import { SaleFormDialog } from "../components/SaleFormDialog";
import { useSales } from "../hooks/useSales";
import { useCancelSale } from "../hooks/useCancelSale";
import type { Sale } from "../types/sale.types";

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

export function VendasPage() {
  const { data, isLoading, isError, refetch } = useSales();
  const { hasRole } = useAuth();

  const cancelSale = useCancelSale();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(INITIAL_FEEDBACK);

  function openCreateDialog() {
    setDialogOpen(true);
  }

  function handleDialogSuccess() {
    setFeedback({
      open: true,
      message: "Venda registrada com sucesso.",
      severity: "success",
    });
  }

  function handleDialogError(message: string) {
    setFeedback({ open: true, message, severity: "error" });
  }

  async function handleConfirmCancel() {
    if (!saleToCancel) {
      return;
    }

    try {
      await cancelSale.mutateAsync(saleToCancel.id);

      setSaleToCancel(null);
      setFeedback({
        open: true,
        message: "Venda cancelada com sucesso.",
        severity: "success",
      });
    } catch (err) {
      setSaleToCancel(null);
      setFeedback({
        open: true,
        message:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Não foi possível cancelar a venda. Tente novamente.",
        severity: "error",
      });
    }
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

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h3">
          Vendas
        </Typography>

        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={openCreateDialog}
        >
          Nova Venda
        </Button>
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
              border: "1px solid #E5E7EB",
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
          message="Não foi possível carregar as vendas. Tente novamente em instantes."
          onRetry={refetch}
        />
      )}

      {data && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ maxWidth: 280 }}>
            <MetricCard
              title="Total de vendas"
              value={String(data.length)}
              icon={<Receipt size={24} />}
            />
          </Box>

          {data.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                py: 8,
                px: 4,
                borderRadius: 3,
                border: "1px dashed #CBD5E1",
                bgcolor: "#F8FAFC",
              }}
            >
              <Receipt
                size={48}
                color="#94A3B8"
              />

              <Typography
                variant="h6"
                fontWeight={700}
                mt={2}
              >
                Nenhuma venda registrada
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                mt={0.5}
                maxWidth={360}
              >
                Assim que vendas forem registradas, elas aparecerão aqui.
              </Typography>
            </Box>
          ) : (
            <SalesTable
              sales={data}
              onCancel={hasRole("ADMIN") ? (sale) => setSaleToCancel(sale) : undefined}
            />
          )}
        </Box>
      )}

      <SaleFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
      />

      <ConfirmDialog
        open={saleToCancel !== null}
        title="Cancelar venda"
        message={
          saleToCancel
            ? `Deseja cancelar a venda #${saleToCancel.id}? O estoque dos produtos será restaurado.`
            : ""
        }
        confirmLabel="Cancelar venda"
        onConfirm={handleConfirmCancel}
        onCancel={() => setSaleToCancel(null)}
        confirming={cancelSale.isPending}
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
