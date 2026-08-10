import { useMutation, useQueryClient } from "@tanstack/react-query";

import { productService } from "../services/product.service";

/**
 * Mutation de criação de produto. Toda a lógica de cache mora aqui: ao
 * criar com sucesso, invalida ["products"] — o useProducts() da listagem
 * refaz o fetch sozinho, sem nenhuma chamada manual na página.
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
