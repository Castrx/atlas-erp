import { useMutation, useQueryClient } from "@tanstack/react-query";

import { categoryService } from "../services/category.service";

/**
 * Mutation de exclusão de categoria. No backend a exclusão é uma inativação
 * (active=false) — a categoria e os produtos já vinculados a ela são
 * preservados; ao concluir, invalida ["categories"].
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
