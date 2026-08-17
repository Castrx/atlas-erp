import { api, ENDPOINTS } from "../../../core/api";
import type { CreateUserInput, UpdateUserInput, User } from "../types/user.types";

export const userService = {
  async getAll(): Promise<User[]> {
    const { data } = await api.get<User[]>(ENDPOINTS.USERS);

    return data;
  },

  async create(input: CreateUserInput): Promise<User> {
    const { data } = await api.post<User>(ENDPOINTS.USERS, input);

    return data;
  },

  async update(id: number, input: UpdateUserInput): Promise<User> {
    const { data } = await api.put<User>(`${ENDPOINTS.USERS}/${id}`, input);

    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${ENDPOINTS.USERS}/${id}`);
  },
};
