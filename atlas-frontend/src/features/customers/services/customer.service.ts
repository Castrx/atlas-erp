import { api, ENDPOINTS } from "../../../core/api";
import type { CreateCustomerInput, Customer } from "../types/customer.types";

export const customerService = {
  async getAll(): Promise<Customer[]> {
    const { data } = await api.get<Customer[]>(ENDPOINTS.CUSTOMERS);

    return data;
  },

  async create(input: CreateCustomerInput): Promise<Customer> {
    const { data } = await api.post<Customer>(ENDPOINTS.CUSTOMERS, input);

    return data;
  },
};
