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

import type { Product } from "../../types/product.types";
import { useCategories } from "../../hooks/useCategories";
import { useCreateProduct } from "../../hooks/useCreateProduct";
import { useUpdateProduct } from "../../hooks/useUpdateProduct";

const schema = z.object({
  name: z.string().trim().min(1, "O nome é obrigatório."),
  description: z.string().trim().optional(),
  sku: z.string().trim().min(1, "O SKU é obrigatório."),
  barcode: z.string().trim().optional(),
  costPrice: z
    .string()
    .trim()
    .min(1, "O preço de custo é obrigatório.")
    .refine((v) => !Number.isNaN(Number(v)), "Informe um valor numérico válido.")
    .refine((v) => Number(v) >= 0, "O preço de custo não pode ser negativo."),
  salePrice: z
    .string()
    .trim()
    .min(1, "O preço de venda é obrigatório.")
    .refine((v) => !Number.isNaN(Number(v)), "Informe um valor numérico válido.")
    .refine((v) => Number(v) >= 0, "O preço de venda não pode ser negativo."),
  stock: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), "Informe um valor numérico válido."),
  minimumStock: z
    .string()
    .trim()
    .optional()
    .refine((v) => !v || !Number.isNaN(Number(v)), "Informe um valor numérico válido."),
  categoryId: z.string().trim().min(1, "Selecione uma categoria."),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  name: "",
  description: "",
  sku: "",
  barcode: "",
  costPrice: "",
  salePrice: "",
  stock: "",
  minimumStock: "",
  categoryId: "",
};

/** Converte o produto em valores de formulário (números viram string, como no create). */
function toFormValues(product: Product): FormValues {
  return {
    name: product.name,
    description: product.description ?? "",
    sku: product.sku,
    barcode: product.barcode ?? "",
    costPrice: String(product.costPrice),
    salePrice: String(product.salePrice),
    stock: String(product.stock),
    minimumStock: String(product.minimumStock),
    categoryId: String(product.categoryId),
  };
}

interface ProductFormDialogProps {
  open: boolean;
  /** Produto em edição; ausente = modo criação. */
  product?: Product | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function ProductFormDialog({
  open,
  product,
  onClose,
  onSuccess,
  onError,
}: ProductFormDialogProps) {
  const isEditing = product !== null && product !== undefined;

  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: isEditing ? toFormValues(product) : DEFAULT_VALUES,
  });

  function handleClose() {
    reset(DEFAULT_VALUES);
    onClose();
  }

  async function onSubmit(values: FormValues) {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      sku: values.sku,
      barcode: values.barcode || undefined,
      costPrice: Number(values.costPrice),
      salePrice: Number(values.salePrice),
      // M4: estoque é imutável no update — só o create envia o estoque inicial;
      // no edit o campo fica desabilitado e não entra no payload do PUT.
      stock: isEditing ? undefined : values.stock ? Number(values.stock) : undefined,
      minimumStock: values.minimumStock ? Number(values.minimumStock) : undefined,
      categoryId: Number(values.categoryId),
    };

    try {
      if (isEditing && product) {
        await updateProduct.mutateAsync({ id: product.id, data: payload });
      } else {
        await createProduct.mutateAsync(payload);
      }

      reset(DEFAULT_VALUES);
      onClose();
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        onError(err.response.data.message);
      } else {
        onError("Não foi possível salvar o produto. Tente novamente.");
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
        <DialogTitle>{isEditing ? "Editar Produto" : "Novo Produto"}</DialogTitle>

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
              label="Descrição"
              {...register("description")}
              fullWidth
              multiline
              minRows={2}
            />

            <Stack
              direction="row"
              spacing={2}
            >
              <TextField
                label="SKU"
                {...register("sku")}
                error={!!errors.sku}
                helperText={errors.sku?.message}
                fullWidth
              />

              <TextField
                label="Código de barras"
                {...register("barcode")}
                fullWidth
              />
            </Stack>

            <Stack
              direction="row"
              spacing={2}
            >
              <TextField
                label="Preço de custo"
                {...register("costPrice")}
                error={!!errors.costPrice}
                helperText={errors.costPrice?.message}
                fullWidth
              />

              <TextField
                label="Preço de venda"
                {...register("salePrice")}
                error={!!errors.salePrice}
                helperText={errors.salePrice?.message}
                fullWidth
              />
            </Stack>

            <Stack
              direction="row"
              spacing={2}
            >
              <TextField
                label="Estoque inicial"
                {...register("stock")}
                disabled={isEditing}
                error={!!errors.stock}
                helperText={isEditing ? "Alterações de estoque são feitas por movimentações." : errors.stock?.message}
                fullWidth
              />

              <TextField
                label="Estoque mínimo"
                {...register("minimumStock")}
                error={!!errors.minimumStock}
                helperText={errors.minimumStock?.message}
                fullWidth
              />
            </Stack>

            <Controller
              name="categoryId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Categoria"
                  error={!!errors.categoryId}
                  helperText={errors.categoryId?.message}
                  fullWidth
                >
                  {categories?.map((category) => (
                    <MenuItem
                      key={category.id}
                      value={String(category.id)}
                    >
                      {category.name}
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
