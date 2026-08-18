import { useMemo } from "react";
import axios from "axios";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Plus, Trash2 } from "lucide-react";

import { useProducts } from "../../../products/hooks/useProducts";
import { useCustomers } from "../../../customers/hooks/useCustomers";
import { useCreateSale } from "../../hooks/useCreateSale";
import type { CreateSaleInput } from "../../types/sale.types";

const itemSchema = z.object({
  productId: z.string().trim().min(1, "Selecione um produto."),
  quantity: z
    .string()
    .trim()
    .min(1, "Informe a quantidade.")
    .refine((v) => !Number.isNaN(Number(v)), "Informe um valor numérico válido."),
});

const schema = z.object({
  customerId: z.string().trim().min(1, "Selecione um cliente."),
  items: z.array(itemSchema).min(1, "Adicione pelo menos um item."),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES: FormValues = {
  customerId: "",
  items: [{ productId: "", quantity: "" }],
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

interface SaleFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export function SaleFormDialog({
  open,
  onClose,
  onSuccess,
  onError,
}: SaleFormDialogProps) {
  const { data: products } = useProducts();
  const { data: customers } = useCustomers();
  const createSale = useCreateSale();

  // Só produtos ativos com estoque disponível entram no seletor — vender
  // produto inativo/sem estoque seria recusado pelo backend de qualquer
  // forma; escondê-los melhora o UX (mesma decisão documentada em Clientes).
  const activeProducts = useMemo(
    () => products?.filter((p) => p.active && p.stock > 0) ?? [],
    [products]
  );

  const activeCustomers = useMemo(
    () => customers?.filter((c) => c.active) ?? [],
    [customers]
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = useWatch({ control, name: "items" });

  // Total estimado em tempo real — puramente informativo; o backend é quem
  // calcula o total final (preço de venda atual do produto × quantidade).
  const total = useMemo(() => {
    return watchedItems.reduce((sum, item) => {
      const product = activeProducts.find((p) => String(p.id) === item.productId);
      const quantity = Number(item.quantity);

      if (!product || !item.quantity || Number.isNaN(quantity)) {
        return sum;
      }

      return sum + product.salePrice * quantity;
    }, 0);
  }, [watchedItems, activeProducts]);

  function handleClose() {
    reset(DEFAULT_VALUES);
    onClose();
  }

  async function onSubmit(values: FormValues) {
    const payload: CreateSaleInput = {
      customerId: Number(values.customerId),
      items: values.items.map((item) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity),
      })),
    };

    try {
      await createSale.mutateAsync(payload);

      reset(DEFAULT_VALUES);
      onClose();
      onSuccess();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        onError(err.response.data.message);
      } else {
        onError("Não foi possível registrar a venda. Tente novamente.");
      }
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="sale-form-dialog-title"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle id="sale-form-dialog-title">Nova Venda</DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            mt={1}
          >
            <Controller
              name="customerId"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Cliente"
                  error={!!errors.customerId}
                  helperText={errors.customerId?.message}
                  fullWidth
                  autoFocus
                >
                  {activeCustomers.map((customer) => (
                    <MenuItem
                      key={customer.id}
                      value={String(customer.id)}
                    >
                      {customer.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            {fields.map((field, index) => {
              const selectedProduct = activeProducts.find(
                (p) => String(p.id) === watchedItems[index]?.productId
              );

              return (
                <Stack
                  key={field.id}
                  direction="row"
                  spacing={1.5}
                  alignItems="flex-start"
                >
                  <Controller
                    name={`items.${index}.productId`}
                    control={control}
                    render={({ field: productField }) => (
                      <TextField
                        {...productField}
                        select
                        label="Produto"
                        error={!!errors.items?.[index]?.productId}
                        helperText={errors.items?.[index]?.productId?.message}
                        fullWidth
                      >
                        {activeProducts.map((product) => (
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
                    label="Qtd"
                    {...register(`items.${index}.quantity`)}
                    error={!!errors.items?.[index]?.quantity}
                    helperText={
                      errors.items?.[index]?.quantity?.message ??
                      (selectedProduct ? `Disponível: ${selectedProduct.stock}` : " ")
                    }
                    sx={{ width: { xs: 88, sm: 130 }, flexShrink: 0 }}
                    inputProps={{ inputMode: "numeric" }}
                  />

                  <IconButton
                    aria-label={`Remover item ${index + 1}`}
                    size="small"
                    color="error"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                    sx={{ mt: 1 }}
                  >
                    <Trash2 size={18} />
                  </IconButton>
                </Stack>
              );
            })}

            <Button
              startIcon={<Plus size={18} />}
              onClick={() => append({ productId: "", quantity: "" })}
              sx={{ alignSelf: "flex-start" }}
            >
              Adicionar item
            </Button>

            {errors.items?.root && (
              <Typography
                variant="body2"
                color="error"
              >
                {errors.items.root.message}
              </Typography>
            )}

            <Typography
              variant="h6"
              fontWeight={700}
              align="right"
            >
              Total: {currencyFormatter.format(total)}
            </Typography>
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
            {isSubmitting ? "Salvando..." : "Registrar venda"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
