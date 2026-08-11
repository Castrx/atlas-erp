/**
 * Espelha com.atlas.backend.dto.customer.CustomerResponse (backend).
 */
export interface Customer {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  document: string;
  active: boolean;
  createdAt: string;
}

/**
 * Espelha com.atlas.backend.dto.customer.CustomerRequest (backend).
 * O backend reutiliza o mesmo DTO para PUT /customers/{id} — este mesmo
 * tipo é o payload de create e de update.
 */
export interface CreateCustomerInput {
  name: string;
  email?: string;
  phone?: string;
  document: string;
}
