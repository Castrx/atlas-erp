import { api, ENDPOINTS } from "../../api";
import type { LoginRequest, LoginResponse } from "../types/auth.types";

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>(
      ENDPOINTS.AUTH.LOGIN,
      credentials
    );

    return data;
  },
};
