import { useMutation, useQueryClient } from "@tanstack/react-query";

import { productService } from "../services/product.service";

/**
 * Mutation de exclusão de produto. No backend a exclusão é uma inativação
 * (active=false) — o produto e seu histórico de vendas/estoque são
 * preservados; ao concluir, invalida ["products"] — a listagem refaz o
 * fetch sozinha.
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
