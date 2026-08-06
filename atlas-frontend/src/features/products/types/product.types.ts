/**
 * Espelha com.atlas.backend.dto.product.ProductResponse (backend).
 */
export interface Product {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  minimumStock: number;
  active: boolean;
  categoryId: number;
  categoryName: string;
}
