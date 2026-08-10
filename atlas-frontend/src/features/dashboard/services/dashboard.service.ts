import { api, ENDPOINTS } from "../../../core/api";
import type { DashboardResponse } from "../types/dashboard.types";

export const dashboardService = {
  async getDashboard(): Promise<DashboardResponse> {
    const { data } = await api.get<DashboardResponse>(ENDPOINTS.DASHBOARD);

    return data;
  },
};
