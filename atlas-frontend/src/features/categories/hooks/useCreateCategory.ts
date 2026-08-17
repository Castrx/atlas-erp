import { useMutation, useQueryClient } from "@tanstack/react-query";

import { categoryService } from "../services/category.service";

/**
 * Mutation de criação de categoria. Ao criar com sucesso, invalida
 * ["categories"] — tanto a listagem própria quanto o seletor de categoria
 * do formulário de produto (que usa a mesma query key) refazem o fetch.
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: categoryService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
