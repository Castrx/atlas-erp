import {
  AlertTriangle,
  Building2,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Box, Skeleton, Typography } from "@mui/material";

import { ErrorState } from "../../../components/ui/ErrorState";
import { MetricCard } from "../../../components/ui/MetricCard";
import { LowStock } from "../components/LowStock";
import { RecentSales } from "../components/RecentSales";
import { SalesChart } from "../components/SalesChart";
import { useDashboard } from "../hooks";
import { formatCurrency } from "../utils";

const METRIC_GRID_COLUMNS = {
  xs: "1fr",
  sm: "repeat(2, 1fr)",
  md: "repeat(4, 1fr)",
};

const WIDGET_GRID_COLUMNS = {
  xs: "1fr",
  md: "repeat(2, 1fr)",
};

export function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboard();

  return (
    <Box>
      <Typography variant="h3" mb={3}>
        Dashboard
      </Typography>

      {isLoading && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: METRIC_GRID_COLUMNS,
              gap: 2,
            }}
          >
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rounded"
                height={104}
                sx={{ borderRadius: 3 }}
              />
            ))}
          </Box>

          <Skeleton
            variant="rounded"
            height={300}
            sx={{ borderRadius: 3 }}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: WIDGET_GRID_COLUMNS,
              gap: 3,
            }}
          >
            <Skeleton
              variant="rounded"
              height={200}
              sx={{ borderRadius: 3 }}
            />
            <Skeleton
              variant="rounded"
              height={200}
              sx={{ borderRadius: 3 }}
            />
          </Box>
        </Box>
      )}

      {isError && (
        <ErrorState
          message="Não foi possível carregar os dados do dashboard. Tente novamente em instantes."
          onRetry={refetch}
        />
      )}

      {data && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: METRIC_GRID_COLUMNS,
              gap: 2,
            }}
          >
            <MetricCard
              title="Produtos ativos"
              value={String(data.totalProducts)}
              icon={<Package size={24} />}
            />

            <MetricCard
              title="Estoque baixo"
              value={String(data.lowStockCount)}
              icon={<AlertTriangle size={24} />}
              color="#D97706"
            />

            <MetricCard
              title="Clientes ativos"
              value={String(data.totalActiveCustomers)}
              icon={<Users size={24} />}
            />

            <MetricCard
              title="Empresas ativas"
              value={String(data.totalActiveCompanies)}
              icon={<Building2 size={24} />}
            />

            <MetricCard
              title="Vendas ativas"
              value={String(data.totalActiveSales)}
              icon={<ShoppingCart size={24} />}
            />

            <MetricCard
              title="Faturamento hoje"
              value={formatCurrency(data.todayRevenue)}
              icon={<Wallet size={24} />}
              color="#16A34A"
            />

            <MetricCard
              title="Faturamento do mês"
              value={formatCurrency(data.monthRevenue)}
              icon={<TrendingUp size={24} />}
              color="#16A34A"
            />
          </Box>

          <SalesChart data={data.salesLast7Days} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: WIDGET_GRID_COLUMNS,
              gap: 3,
            }}
          >
            <RecentSales sales={data.recentSales} />
            <LowStock products={data.lowStockProducts} />
          </Box>
        </Box>
      )}
    </Box>
  );
}
