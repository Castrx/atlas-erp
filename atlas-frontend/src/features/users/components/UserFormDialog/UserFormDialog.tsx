import axios from "axios";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";

import type { User } from "../../types/user.types";
import { useCreateUser } from "../../hooks/useCreateUser";
import { useUpdateUser } from "../../hooks/useUpdateUser";

const ROLES = ["ADMIN", "USER"] as const;

const baseSchema = {
  name: z.string().trim().min(1, "O nome é obrigatório."),
  email: z.string().trim().min(1, "O e-mail é obrigatório.").email("E-mail inválido."),
  role: z.string().trim().min(1, "Selecione um perfil."),
};

// Na criação a senha é obrigatória; na edição é opcional (vazio = mantém a
// senha atual) — dois schemas, mesmo racional de UpdateUserRequest no
// backend (@Size ignora null/vazio).
const createSchema = z.object({
  ...baseSchema,
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
});

const editSchema = z.object({
  ...baseSchema,
  password: z
    .string()
    .trim()
    .refine((value) => value === "" || value.length >= 8, {
      message: "A senha deve ter no mínimo 8 caracteres.",
    }),
});

type FormValues = {
  name: string;
  email: string;
  password: string;
  role: string;
};

const DEFAULT_VALUES: FormValues = {
  name: "",
  email: "",
  password: "",
  role: "",
};

/**
 * Converte o usuário em valores de formulário. UserResponse não devolve o
 * papel atual — `role` fica vazio de propósito, forçando o ADMIN a
 * escolher explicitamente antes de salvar (evita reenviar um perfil errado
 * por engano). Senha também fica vazia (não é reenviada; vazio = mantém).
 */
function toFormValues(user: User): FormValues {
  return {
    name: user.name,
    email: user.email,
    password: "",
    role: "",
  };
}

interface UserFormDialogProps {
  open: boolean;
  /** Usuário em edição; ausente = modo criação. */
  user?: User | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function UserFormDialog({
  open,
  user,
  onClose,
  onSuccess,
  onError,
}: UserFormDialogProps) {
  const isEditing = user !== null && user !== undefined;

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(isEditing ? editSchema : createSchema),
    defaultValues: isEditing && user ? toFormValues(user) : DEFAULT_VALUES,
  });

  function handleClose() {
    reset(DEFAULT_VALUES);
    onClose();
  }

  async function onSubmit(values: FormValues) {
    try {
      if (isEditing && user) {
        await updateUser.mutateAsync({
          id: user.id,
          data: {
            name: values.name,
            email: values.email,
            password: values.password || undefined,
            role: values.role,
          },
        });
      } else {
        await createUser.mutateAsync({
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
        });
      }

      reset(DEFAULT_VALUES);
      onClose();
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        onError(err.response.data.message);
      } else {
        onError("Não foi possível salvar o usuário. Tente novamente.");
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
        <DialogTitle>{isEditing ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>

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
              label="E-mail"
              {...register("email")}
              error={!!errors.email}
              helperText={errors.email?.message}
              fullWidth
            />

            <TextField
              label={isEditing ? "Nova senha (opcional)" : "Senha"}
              type="password"
              {...register("password")}
              error={!!errors.password}
              helperText={
                errors.password?.message ??
                (isEditing ? "Deixe em branco para manter a senha atual." : undefined)
              }
              fullWidth
            />

            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Perfil"
                  error={!!errors.role}
                  helperText={errors.role?.message}
                  fullWidth
                >
                  {ROLES.map((role) => (
                    <MenuItem
                      key={role}
                      value={role}
                    >
                      {role}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
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
