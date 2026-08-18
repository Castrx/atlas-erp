import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

import type { Customer } from "../../types/customer.types";
import { useCreateCustomer } from "../../hooks/useCreateCustomer";
import { useUpdateCustomer } from "../../hooks/useUpdateCustomer";

const schema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório."),
  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().optional(),
  document: z.string().trim().min(1, "O documento é obrigatório."),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  name: "",
  email: "",
  phone: "",
  document: "",
};

/** Converte o cliente em valores de formulário (nulos viram string vazia). */
function toFormValues(customer: Customer): FormValues {
  return {
    name: customer.name,
    document: customer.document,
    email: customer.email ?? "",
    phone: customer.phone ?? "",
  };
}

interface CustomerFormDialogProps {
  open: boolean;
  /** Cliente em edição; ausente = modo criação. */
  customer?: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function CustomerFormDialog({
  open,
  customer,
  onClose,
  onSuccess,
  onError,
}: CustomerFormDialogProps) {
  const isEditing = customer !== null && customer !== undefined;

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: isEditing ? toFormValues(customer) : DEFAULT_VALUES,
  });

  function handleClose() {
    reset(DEFAULT_VALUES);
    onClose();
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      email: values.email || undefined,
      phone: values.phone || undefined,
      document: values.document,
    };

    try {
      if (isEditing && customer) {
        await updateCustomer.mutateAsync({ id: customer.id, data: payload });
      } else {
        await createCustomer.mutateAsync(payload);
      }

      reset(DEFAULT_VALUES);
      onClose();
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        onError(err.response.data.message);
      } else {
        onError("Não foi possível salvar o cliente. Tente novamente.");
      }
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="customer-form-dialog-title"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle id="customer-form-dialog-title">
          {isEditing ? "Editar Cliente" : "Novo Cliente"}
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            mt={1}
          >
            <TextField
              label="Nome"
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
              fullWidth
              autoFocus
            />

            <TextField
              label="Documento (CPF/CNPJ)"
              {...register("document")}
              error={!!errors.document}
              helperText={errors.document?.message}
              fullWidth
            />

            <Stack
              direction="row"
              spacing={2}
            >
              <TextField
                label="E-mail"
                {...register("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
                fullWidth
              />

              <TextField
                label="Telefone"
                {...register("phone")}
                fullWidth
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
