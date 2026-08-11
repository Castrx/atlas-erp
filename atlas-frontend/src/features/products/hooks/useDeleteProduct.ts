import { useMutation, useQueryClient } from "@tanstack/react-query";

import { productService } from "../services/product.service";

/**
 * Mutation de exclusão de produto. Ao excluir com sucesso, invalida
 * ["products"] — a listagem refaz o fetch sozinho.
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
