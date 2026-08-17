import { useMutation, useQueryClient } from "@tanstack/react-query";

import { companyService } from "../services/company.service";

/**
 * Mutation de criação de empresa. Ao criar com sucesso, invalida
 * ["companies"] — a listagem refaz o fetch sozinha.
 */
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: companyService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}
