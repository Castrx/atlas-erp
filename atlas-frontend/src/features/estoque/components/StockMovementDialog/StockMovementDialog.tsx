import { useMemo } from "react";
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

import { useProducts } from "../../../products/hooks/useProducts";
import { useStockEntry } from "../../hooks/useStockEntry";
import { useStockExit } from "../../hooks/useStockExit";
import type { StockMovementInput } from "../../types/stock.types";

export type MovementMode = "entry" | "exit";

const schema = z.object({
  productId: z.string().trim().min(1, "Selecione um produto."),
  quantity: z
    .string()
    .trim()
    .min(1, "Informe a quantidade.")
    .refine((v) => !Number.isNaN(Number(v)), "Informe um valor numérico válido.")
    .refine((v) => Number(v) >= 1, "A quantidade deve ser maior que zero."),
  reason: z
    .string()
    .trim()
    .min(1, "Informe o motivo.")
    .max(255, "O motivo deve ter no máximo 255 caracteres."),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  productId: "",
  quantity: "",
  reason: "",
};

interface StockMovementDialogProps {
  open: boolean;
  /** Entrada ou saída de estoque. */
  mode: MovementMode;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function StockMovementDialog({
  open,
  mode,
  onClose,
  onSuccess,
  onError,
}: StockMovementDialogProps) {
  const { data: products } = useProducts();
  const stockEntry = useStockEntry();
  const stockExit = useStockExit();

  const isEntry = mode === "entry";

  // Entrada aceita qualquer produto ativo; saída só faz sentido com estoque
  // disponível (o backend rejeitaria "Estoque insuficiente." de qualquer
  // forma) — ocultar esgota o seletor e melhora o UX.
  const selectableProducts = useMemo(
    () =>
      products?.filter((p) => (isEntry ? p.active : p.active && p.stock > 0)) ?? [],
    [products, isEntry]
  );

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  function handleClose() {
    reset(DEFAULT_VALUES);
    onClose();
  }

  async function onSubmit(values: FormValues) {
    const payload: StockMovementInput = {
      productId: Number(values.productId),
      quantity: Number(values.quantity),
      reason: values.reason.trim(),
    };

    try {
      if (isEntry) {
        await stockEntry.mutateAsync(payload);
      } else {
        await stockExit.mutateAsync(payload);
      }

      reset(DEFAULT_VALUES);
      onClose();
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        onError(err.response.data.message);
      } else {
        onError(`Não foi possível registrar a ${isEntry ? "entrada" : "saída"}. Tente novamente.`);
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
        <DialogTitle>
          {isEntry ? "Entrada de Estoque" : "Saída de Estoque"}
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            mt={1}
          >
            <Controller
              name="productId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Produto"
                  error={!!errors.productId}
                  helperText={errors.productId?.message}
                  fullWidth
                  autoFocus
                >
                  {selectableProducts.map((product) => (
                    <MenuItem
                      key={product.id}
                      value={String(product.id)}
                    >
                      {product.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <TextField
              label="Quantidade"
              {...register("quantity")}
              error={!!errors.quantity}
              helperText={errors.quantity?.message}
              fullWidth
              inputProps={{ inputMode: "numeric" }}
            />

            <TextField
              label="Motivo"
              {...register("reason")}
              error={!!errors.reason}
              helperText={errors.reason?.message}
              fullWidth
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
            {isSubmitting
              ? "Salvando..."
              : isEntry
                ? "Registrar entrada"
                : "Registrar saída"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
