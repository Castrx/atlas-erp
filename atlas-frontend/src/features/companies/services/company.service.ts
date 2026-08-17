import { api, ENDPOINTS } from "../../../core/api";
import type { Company, CreateCompanyInput } from "../types/company.types";

export const companyService = {
  async getAll(): Promise<Company[]> {
    const { data } = await api.get<Company[]>(ENDPOINTS.COMPANIES);

    return data;
  },

  async create(input: CreateCompanyInput): Promise<Company> {
    const { data } = await api.post<Company>(ENDPOINTS.COMPANIES, input);

    return data;
  },

  async update(id: number, input: CreateCompanyInput): Promise<Company> {
    const { data } = await api.put<Company>(`${ENDPOINTS.COMPANIES}/${id}`, input);

    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`${ENDPOINTS.COMPANIES}/${id}`);
  },
};
