import { useMutation, useQueryClient } from "@tanstack/react-query";

import { userService } from "../services/user.service";
import type { UpdateUserInput } from "../types/user.types";

interface UseUpdateUserInput {
  id: number;
  data: UpdateUserInput;
}

/**
 * Mutation de atualização de usuário. Ao atualizar com sucesso, invalida
 * ["users"] — mesmo padrão do create.
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: UseUpdateUserInput) => userService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
