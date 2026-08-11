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
 * O UpdateProductRequest tem exatamente os mesmos campos — este mesmo
 * tipo é reutilizado como payload de PUT /products/{id}.
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
