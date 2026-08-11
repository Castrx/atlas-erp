import { useState } from "react";
import axios from "axios";
import { Package, PackageSearch, Plus } from "lucide-react";
import { Alert, Box, Button, Skeleton, Snackbar, Stack, Typography } from "@mui/material";

import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { ErrorState } from "../../../components/ui/ErrorState";
import { MetricCard } from "../../../components/ui/MetricCard";
import { useAuth } from "../../../core/auth";
import { ProductFormDialog } from "../components/ProductFormDialog";
import { ProductsTable } from "../components/ProductsTable";
import { useDeleteProduct } from "../hooks/useDeleteProduct";
import { useProducts } from "../hooks/useProducts";
import type { Product } from "../types/product.types";

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
  const { hasRole } = useAuth();

  const deleteProduct = useDeleteProduct();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(INITIAL_FEEDBACK);

  function openCreateDialog() {
    setEditingProduct(null);
    setDialogOpen(true);
  }

  function handleDialogSuccess() {
    setFeedback({
      open: true,
      message: editingProduct
        ? "Produto atualizado com sucesso."
        : "Produto criado com sucesso.",
      severity: "success",
    });
  }

  function handleDialogError(message: string) {
    setFeedback({ open: true, message, severity: "error" });
  }

  async function handleConfirmDelete() {
    if (!productToDelete) {
      return;
    }

    try {
      await deleteProduct.mutateAsync(productToDelete.id);

      setProductToDelete(null);
      setFeedback({
        open: true,
        message: "Produto excluído com sucesso.",
        severity: "success",
      });
    } catch (err) {
      setProductToDelete(null);
      setFeedback({
        open: true,
        message:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Não foi possível excluir o produto. Tente novamente.",
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
          Produtos
        </Typography>

        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={openCreateDialog}
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
            <ProductsTable
              products={data}
              onEdit={(product) => {
                setEditingProduct(product);
                setDialogOpen(true);
              }}
              onDelete={hasRole("ADMIN") ? (product) => setProductToDelete(product) : undefined}
            />
          )}
        </Box>
      )}

      <ProductFormDialog
        key={editingProduct?.id ?? "create"}
        open={dialogOpen}
        product={editingProduct}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
      />

      <ConfirmDialog
        open={productToDelete !== null}
        title="Excluir produto"
        message={
          productToDelete
            ? `Deseja excluir "${productToDelete.name}"? Essa ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setProductToDelete(null)}
        confirming={deleteProduct.isPending}
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
