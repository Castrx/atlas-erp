import { useMutation, useQueryClient } from "@tanstack/react-query";

import { productService } from "../services/product.service";
import type { CreateProductInput } from "../types/product.types";

interface UseUpdateProductInput {
  id: number;
  data: CreateProductInput;
}

/**
 * Mutation de atualização de produto. Ao atualizar com sucesso, invalida
 * ["products"] — a listagem refaz o fetch sozinho (mesmo padrão do create).
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UseUpdateProductInput) =>
      productService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
