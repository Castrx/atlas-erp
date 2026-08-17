import { useState } from "react";
import axios from "axios";
import { Building2, Plus } from "lucide-react";
import { Alert, Box, Button, Skeleton, Snackbar, Stack, Typography } from "@mui/material";

import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { ErrorState } from "../../../components/ui/ErrorState";
import { MetricCard } from "../../../components/ui/MetricCard";
import { tokens } from "../../../core/theme/tokens";
import { CompanyFormDialog } from "../components/CompanyFormDialog";
import { CompaniesTable } from "../components/CompaniesTable";
import { useCompanies } from "../hooks/useCompanies";
import { useDeleteCompany } from "../hooks/useDeleteCompany";
import type { Company } from "../types/company.types";

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
 * Rota /companies já é ADMIN-only (ProtectedRoute requiredRole="ADMIN") e o
 * backend também é ADMIN-only em toda a extensão (CompanyController) — não
 * há um segundo nível de RBAC dentro desta página.
 */
export function CompaniesPage() {
  const { data, isLoading, isError, refetch } = useCompanies();

  const deleteCompany = useDeleteCompany();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(INITIAL_FEEDBACK);

  function openCreateDialog() {
    setEditingCompany(null);
    setDialogOpen(true);
  }

  function handleDialogSuccess() {
    setFeedback({
      open: true,
      message: editingCompany
        ? "Empresa atualizada com sucesso."
        : "Empresa criada com sucesso.",
      severity: "success",
    });
  }

  function handleDialogError(message: string) {
    setFeedback({ open: true, message, severity: "error" });
  }

  async function handleConfirmDelete() {
    if (!companyToDelete) {
      return;
    }

    try {
      await deleteCompany.mutateAsync(companyToDelete.id);

      setCompanyToDelete(null);
      setFeedback({
        open: true,
        message: "Empresa excluída com sucesso.",
        severity: "success",
      });
    } catch (err) {
      setCompanyToDelete(null);
      setFeedback({
        open: true,
        message:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Não foi possível excluir a empresa. Tente novamente.",
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
          Empresas
        </Typography>

        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={openCreateDialog}
        >
          Nova Empresa
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
          message="Não foi possível carregar as empresas. Tente novamente em instantes."
          onRetry={refetch}
        />
      )}

      {data && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ maxWidth: 280 }}>
            <MetricCard
              title="Total de empresas"
              value={String(data.length)}
              icon={<Building2 size={24} />}
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
                border: "1px dashed",
                borderColor: "divider",
                bgcolor: "background.default",
              }}
            >
              <Building2
                size={48}
                color={tokens.colors.textSecondary}
              />

              <Typography
                variant="h6"
                fontWeight={700}
                mt={2}
              >
                Nenhuma empresa cadastrada
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                mt={0.5}
                maxWidth={360}
              >
                Assim que empresas forem cadastradas, elas aparecerão aqui.
              </Typography>
            </Box>
          ) : (
            <CompaniesTable
              companies={data}
              onEdit={(company) => {
                setEditingCompany(company);
                setDialogOpen(true);
              }}
              onDelete={(company) => setCompanyToDelete(company)}
            />
          )}
        </Box>
      )}

      <CompanyFormDialog
        key={editingCompany?.id ?? "create"}
        open={dialogOpen}
        company={editingCompany}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
      />

      <ConfirmDialog
        open={companyToDelete !== null}
        title="Excluir empresa"
        message={
          companyToDelete
            ? `Deseja excluir "${companyToDelete.tradeName}"? Essa ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setCompanyToDelete(null)}
        confirming={deleteCompany.isPending}
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
