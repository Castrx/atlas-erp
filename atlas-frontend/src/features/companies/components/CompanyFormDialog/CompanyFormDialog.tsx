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

import type { Company } from "../../types/company.types";
import { useCreateCompany } from "../../hooks/useCreateCompany";
import { useUpdateCompany } from "../../hooks/useUpdateCompany";

const schema = z.object({
  corporateName: z.string().trim().min(1, "A razão social é obrigatória."),
  tradeName: z.string().trim().min(1, "O nome fantasia é obrigatório."),
  cnpj: z
    .string()
    .trim()
    .regex(/^\d{14}$/, "O CNPJ deve ter 14 dígitos (somente números)."),
  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  corporateName: "",
  tradeName: "",
  cnpj: "",
  email: "",
  phone: "",
};

/** Converte a empresa em valores de formulário (nulos viram string vazia). */
function toFormValues(company: Company): FormValues {
  return {
    corporateName: company.corporateName,
    tradeName: company.tradeName,
    cnpj: company.cnpj,
    email: company.email ?? "",
    phone: company.phone ?? "",
  };
}

interface CompanyFormDialogProps {
  open: boolean;
  /** Empresa em edição; ausente = modo criação. */
  company?: Company | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function CompanyFormDialog({
  open,
  company,
  onClose,
  onSuccess,
  onError,
}: CompanyFormDialogProps) {
  const isEditing = company !== null && company !== undefined;

  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: isEditing ? toFormValues(company) : DEFAULT_VALUES,
  });

  function handleClose() {
    reset(DEFAULT_VALUES);
    onClose();
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      corporateName: values.corporateName,
      tradeName: values.tradeName,
      cnpj: values.cnpj,
      email: values.email || undefined,
      phone: values.phone || undefined,
    };

    try {
      if (isEditing && company) {
        await updateCompany.mutateAsync({ id: company.id, data: payload });
      } else {
        await createCompany.mutateAsync(payload);
      }

      reset(DEFAULT_VALUES);
      onClose();
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        onError(err.response.data.message);
      } else {
        onError("Não foi possível salvar a empresa. Tente novamente.");
      }
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle>{isEditing ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            mt={1}
          >
            <TextField
              label="Razão social"
              {...register("corporateName")}
              error={!!errors.corporateName}
              helperText={errors.corporateName?.message}
              fullWidth
              autoFocus
            />

            <TextField
              label="Nome fantasia"
              {...register("tradeName")}
              error={!!errors.tradeName}
              helperText={errors.tradeName?.message}
              fullWidth
            />

            <TextField
              label="CNPJ"
              placeholder="Somente números (14 dígitos)"
              {...register("cnpj")}
              error={!!errors.cnpj}
              helperText={errors.cnpj?.message}
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
