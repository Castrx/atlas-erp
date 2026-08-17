import { useMutation, useQueryClient } from "@tanstack/react-query";

import { companyService } from "../services/company.service";
import type { CreateCompanyInput } from "../types/company.types";

interface UseUpdateCompanyInput {
  id: number;
  data: CreateCompanyInput;
}

/**
 * Mutation de atualização de empresa. Ao atualizar com sucesso, invalida
 * ["companies"] — mesmo padrão do create.
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UseUpdateCompanyInput) => companyService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
    },
  });
}
