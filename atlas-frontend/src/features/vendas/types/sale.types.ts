/**
 * Espelham com.atlas.backend.dto.sale.* no backend.
 */

/** Espelha com.atlas.backend.dto.sale.SaleItemResponse. */
export interface SaleItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/** Espelha com.atlas.backend.dto.sale.SaleResponse. */
export interface Sale {
  id: number;
  customerId: number;
  customerName: string;
  total: number;
  createdBy: string;
  createdAt: string;
  items: SaleItem[];
}

/** Espelha com.atlas.backend.dto.sale.SaleItemRequest. */
export interface CreateSaleItemInput {
  productId: number;
  quantity: number;
}

/** Espelha com.atlas.backend.dto.sale.SaleRequest. */
export interface CreateSaleInput {
  customerId: number;
  items: CreateSaleItemInput[];
}
