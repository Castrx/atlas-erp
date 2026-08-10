import { useState } from "react";
import { Package, PackageSearch, Plus } from "lucide-react";
import { Alert, Box, Button, Skeleton, Snackbar, Stack, Typography } from "@mui/material";

import { ErrorState } from "../../../components/ui/ErrorState";
import { MetricCard } from "../../../components/ui/MetricCard";
import { ProductFormDialog } from "../components/ProductFormDialog";
import { ProductsTable } from "../components/ProductsTable";
import { useProducts } from "../hooks/useProducts";

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

export function ProductsPage() {
  const { data, isLoading, isError, refetch } = useProducts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(INITIAL_FEEDBACK);

  function handleCreateSuccess() {
    setFeedback({
      open: true,
      message: "Produto criado com sucesso.",
      severity: "success",
    });
  }

  function handleCreateError(message: string) {
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

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h3">
          Produtos
        </Typography>

        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={() => setDialogOpen(true)}
        >
          Novo Produto
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
          message="Não foi possível carregar os produtos. Tente novamente em instantes."
          onRetry={refetch}
        />
      )}

      {data && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ maxWidth: 280 }}>
            <MetricCard
              title="Total de produtos"
              value={String(data.length)}
              icon={<Package size={24} />}
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
              <PackageSearch
                size={48}
                color="#94A3B8"
              />

              <Typography
                variant="h6"
                fontWeight={700}
                mt={2}
              >
                Nenhum produto cadastrado
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                mt={0.5}
                maxWidth={360}
              >
                Assim que produtos forem cadastrados, eles aparecerão aqui.
              </Typography>
            </Box>
          ) : (
            <ProductsTable products={data} />
          )}
        </Box>
      )}

      <ProductFormDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleCreateSuccess}
        onError={handleCreateError}
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
