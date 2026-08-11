/**
 * Espelham com.atlas.backend.dto.stock.* e com.atlas.backend.entity.MovementType
 * no backend.
 */

/** Espelha com.atlas.backend.entity.MovementType. */
export type MovementType = "ENTRY" | "EXIT" | "ADJUSTMENT";

/** Espelha com.atlas.backend.dto.stock.StockMovementResponse. */
export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  type: MovementType;
  quantity: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

/** Espelha com.atlas.backend.dto.stock.StockMovementRequest. */
export interface StockMovementInput {
  productId: number;
  quantity: number;
  reason: string;
}

/**
 * Espelha o Page<T> serializado pelo Spring Data (GET /stock/history), com
 * os campos que a UI de fato usa para listar e paginar.
 */
export interface StockHistoryPage {
  content: StockMovement[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
