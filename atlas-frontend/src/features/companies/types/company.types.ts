/**
 * Espelha com.atlas.backend.dto.company.CompanyResponse (backend).
 */
export interface Company {
  id: number;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  email: string | null;
  phone: string | null;
  active: boolean;
}

/**
 * Espelha com.atlas.backend.dto.company.CreateCompanyRequest /
 * UpdateCompanyRequest (backend) — mesmo shape nos dois records; um único
 * tipo de input cobre create e update. `cnpj` precisa ser só dígitos
 * (14 caracteres — validado por @Pattern(\\d{14}) no backend).
 */
export interface CreateCompanyInput {
  corporateName: string;
  tradeName: string;
  cnpj: string;
  email?: string;
  phone?: string;
}
