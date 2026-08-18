import { useMemo, useState } from "react";
import axios from "axios";
import { Plus, UserSearch, Users } from "lucide-react";
import { Alert, Box, Button, Skeleton, Snackbar, Stack, Typography } from "@mui/material";

import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { ErrorState } from "../../../components/ui/ErrorState";
import { MetricCard } from "../../../components/ui/MetricCard";
import { useAuth } from "../../../core/auth";
import { tokens } from "../../../core/theme/tokens";
import { CustomerFormDialog } from "../components/CustomerFormDialog";
import { CustomersTable } from "../components/CustomersTable";
import { useCustomers } from "../hooks/useCustomers";
import { useDeleteCustomer } from "../hooks/useDeleteCustomer";
import type { Customer } from "../types/customer.types";

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

export function CustomersPage() {
  const { data, isLoading, isError, refetch } = useCustomers();
  const { hasRole } = useAuth();

  const deleteCustomer = useDeleteCustomer();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(INITIAL_FEEDBACK);

  // A exclusão de cliente no backend é uma inativação (active = false) e o
  // GET /customers retorna todos. Para o "Excluir" ter o efeito esperado na
  // UI, a listagem e o métrico consideram apenas os ativos. (Decisão de
  // escopo da Sprint 8A: filtrar aqui, no frontend; filtrar no backend fica
  // como item de backlog.)
  const activeCustomers = useMemo(() => data?.filter((c) => c.active) ?? [], [data]);

  function openCreateDialog() {
    setEditingCustomer(null);
    setDialogOpen(true);
  }

  function handleDialogSuccess() {
    setFeedback({
      open: true,
      message: editingCustomer
        ? "Cliente atualizado com sucesso."
        : "Cliente criado com sucesso.",
      severity: "success",
    });
  }

  function handleDialogError(message: string) {
    setFeedback({ open: true, message, severity: "error" });
  }

  async function handleConfirmDelete() {
    if (!customerToDelete) {
      return;
    }

    try {
      await deleteCustomer.mutateAsync(customerToDelete.id);

      setCustomerToDelete(null);
      setFeedback({
        open: true,
        message: "Cliente excluído com sucesso.",
        severity: "success",
      });
    } catch (err) {
      setCustomerToDelete(null);
      setFeedback({
        open: true,
        message:
          axios.isAxiosError(err) && err.response?.data?.message
            ? err.response.data.message
            : "Não foi possível excluir o cliente. Tente novamente.",
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
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.5}
        mb={3}
      >
        <Typography variant="h3">
          Clientes
        </Typography>

        <Button
          variant="contained"
          startIcon={<Plus size={18} />}
          onClick={openCreateDialog}
        >
          Novo Cliente
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
          message="Não foi possível carregar os clientes. Tente novamente em instantes."
          onRetry={refetch}
        />
      )}

      {data && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ maxWidth: 280 }}>
            <MetricCard
              title="Total de clientes"
              value={String(activeCustomers.length)}
              icon={<Users size={24} />}
            />
          </Box>

          {activeCustomers.length === 0 ? (
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
              <UserSearch
                size={48}
                color={tokens.colors.textSecondary}
              />

              <Typography
                variant="h6"
                fontWeight={700}
                mt={2}
              >
                Nenhum cliente cadastrado
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
                mt={0.5}
                maxWidth={360}
              >
                Assim que clientes forem cadastrados, eles aparecerão aqui.
              </Typography>
            </Box>
          ) : (
            <CustomersTable
              customers={activeCustomers}
              onEdit={(customer) => {
                setEditingCustomer(customer);
                setDialogOpen(true);
              }}
              onDelete={hasRole("ADMIN") ? (customer) => setCustomerToDelete(customer) : undefined}
            />
          )}
        </Box>
      )}

      <CustomerFormDialog
        key={editingCustomer?.id ?? "create"}
        open={dialogOpen}
        customer={editingCustomer}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
        onError={handleDialogError}
      />

      <ConfirmDialog
        open={customerToDelete !== null}
        title="Excluir cliente"
        message={
          customerToDelete
            ? `Deseja excluir "${customerToDelete.name}"? Essa ação não pode ser desfeita.`
            : ""
        }
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
        onCancel={() => setCustomerToDelete(null)}
        confirming={deleteCustomer.isPending}
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
