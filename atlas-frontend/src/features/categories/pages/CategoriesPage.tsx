import { useMemo, useState } from "react";
import axios from "axios";
import { Plus, Tags } from "lucide-react";
import { Alert, Box, Button, Skeleton, Snackbar, Stack, Typography } from "@mui/material";

import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { ErrorState } from "../../../components/ui/ErrorState";
import { MetricCard } from "../../../components/ui/MetricCard";
import { useAuth } from "../../../core/auth";
import { tokens } from "../../../core/theme/tokens";
import { CategoryFormDialog } from "../components/CategoryFormDialog";
import { CategoriesTable } from "../components/CategoriesTable";
import { useCategories } from "../hooks/useCategories";
import { useDeleteCategory } from "../hooks/useDeleteCategory";
import type { Category } from "../types/category.types";

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

/**
 * Leitura é USER+ADMIN no backend (CategoryController); escrita (criar,
 * editar, excluir) é ADMIN-only — por isso "Nova Categoria" e as ações da
 * tabela só aparecem para ADMIN, mesmo padrão de RBAC (UX) já usado em
 * Produtos/Clientes/Vendas.
 */
export function CategoriesPage() {
  const { data, isLoading, isError, refetch } = useCategories();
  const { hasRole } = useAuth();
  const isAdmin = hasRole("ADMIN");

  const deleteCategory = useDeleteCategory();

  // A exclusão de categoria no backend é uma inativação (active = false) e o
  // GET /categories retorna todas. Para o "Inativar" ter o efeito esperado
  // na UI, a listagem e o métrico consideram apenas as ativas — mesmo
  // padrão já usado em Clientes/Produtos.
  const activeCategories = useMemo(() => data?.filter((c) => c.active) ?? [], [data]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(INITIAL_FEEDBACK);

  function openCreateDialog() {
    setEditingCategory(null);
    setDialogOpen(true);
  }

  function handleDialogSuccess() {
    setFeedback({
      open: true,
      message: editingCategory
        ? "Categoria atualizada com sucesso."
        : "Categoria criada com sucesso.",
      severity: "success",
    });
  }

  function handleDialogError(message: string) {
    setFeedback({ open: true, message, severity: "error" });
  }

  async function handleConfirmDelete() {
    if (!categoryToDelete) {
      return;
    }

    try {
      await deleteCategory.mutateAsync(categoryToDelete.id);

      setCategoryToDelete(null);
      setFeedback({
        open: true,
        message: "Categoria inativada com sucesso.",
        severity: "success",
      });
    } catch (err) {
      setCategoryToDelete(null);
      setFeedback({
        open: true,
        message:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Não foi possível inativar a categoria. Tente novamente.",
        severity: "error",
      });
    }
  }

  function closeFeedback(_event?: unknown, reason?: string) {
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
          Categorias
        </Typography>

        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={openCreateDialog}
          >
            Nova Categoria
          </Button>
        )}
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
          message="Não foi possível carregar as categorias. Tente novamente em instantes."
          onRetry={refetch}
        />
      )}

      {data && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ maxWidth: 280 }}>
            <MetricCard
              title="Total de categorias"
              value={String(activeCategories.length)}
              icon={<Tags size={24} />}
            />
          </Box>

          {activeCategories.length === 0 ? (
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
              <Tags
                size={48}
                color={tokens.colors.textSecondary}
              />

              <Typography
                variant="h6"
                fontWeight={700}
                mt={2}
              >
                Nenhuma categoria cadastrada
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                mt={0.5}
                maxWidth={360}
              >
                Assim que categorias forem cadastradas, elas aparecerão aqui.
              </Typography>
            </Box>
          ) : (
            <CategoriesTable
              categories={activeCategories}
              onEdit={isAdmin ? (category) => {
                setEditingCategory(category);
                setDialogOpen(true);
              } : undefined}
              onDelete={isAdmin ? (category) => setCategoryToDelete(category) : undefined}
            />
          )}
        </Box>
      )}

      {isAdmin && (
        <CategoryFormDialog
          key={editingCategory?.id ?? "create"}
          open={dialogOpen}
          category={editingCategory}
          onClose={() => setDialogOpen(false)}
          onSuccess={handleDialogSuccess}
          onError={handleDialogError}
        />
      )}

      <ConfirmDialog
        open={categoryToDelete !== null}
        title="Inativar categoria"
        message={
          categoryToDelete
            ? `Deseja inativar "${categoryToDelete.name}"? A categoria deixará de aparecer nas listagens, mas os produtos já vinculados a ela serão preservados.`
            : ""
        }
        confirmLabel="Inativar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
        confirming={deleteCategory.isPending}
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
