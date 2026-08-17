import { useMutation, useQueryClient } from "@tanstack/react-query";

import { categoryService } from "../services/category.service";
import type { CreateCategoryInput } from "../types/category.types";

interface UseUpdateCategoryInput {
  id: number;
  data: CreateCategoryInput;
}

/**
 * Mutation de atualização de categoria. Ao atualizar com sucesso, invalida
 * ["categories"] — mesmo padrão do create.
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UseUpdateCategoryInput) =>
      categoryService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });
}
