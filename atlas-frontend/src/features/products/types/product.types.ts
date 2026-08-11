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

/**
 * Espelha com.atlas.backend.dto.product.CreateProductRequest (backend).
 *
 * O UpdateProductRequest NÃO aceita "stock" (M4): no PUT o payload reutiliza
 * este tipo, mas o ProductFormDialog envia stock apenas no create — no modo
 * edição o campo fica desabilitado e o valor é undefined.
 */
export interface CreateProductInput {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  costPrice: number;
  salePrice: number;
  stock?: number;
  minimumStock?: number;
  categoryId: number;
}
