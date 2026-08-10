/**
 * Espelha 1:1 com.atlas.backend.dto.dashboard.* no backend. Contrato aditivo
 * por design (ver DashboardResponse.java): novos indicadores entram como
 * novos campos, nunca alterando ou removendo os existentes.
 */

export interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stock: number;
  minimumStock: number;
}

export interface RecentSale {
  id: number;
  customerName: string;
  total: number;
  createdAt: string;
}

export interface DailyRevenue {
  date: string;
  total: number;
}

export interface DashboardResponse {
  totalProducts: number;
  lowStockCount: number;
  totalActiveCustomers: number;
  totalActiveCompanies: number;
  totalActiveSales: number;
  todayRevenue: number;
  monthRevenue: number;
  lowStockProducts: LowStockProduct[];
  recentSales: RecentSale[];
  salesLast7Days: DailyRevenue[];
}
