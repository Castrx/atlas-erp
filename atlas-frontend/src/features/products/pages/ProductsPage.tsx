import { Package } from "lucide-react";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";

import { MetricCard } from "../../../components/ui/MetricCard";
import { ProductsTable } from "../components/ProductsTable";
import { useProducts } from "../hooks/useProducts";

export function ProductsPage() {
  const { data, isLoading, isError } = useProducts();

  return (
    <Box>
      <Typography variant="h3" mb={3}>
        Produtos
      </Typography>

      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">
          Não foi possível carregar os produtos. Tente novamente em
          instantes.
        </Alert>
      )}

      {data && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <Box sx={{ maxWidth: 280 }}>
            <MetricCard
              title="Total de produtos"
              value={String(data.length)}
              icon={<Package size={24} />}
            />
          </Box>

          {data.length === 0 ? (
            <Alert severity="info">Nenhum produto cadastrado.</Alert>
          ) : (
            <ProductsTable products={data} />
          )}
        </Box>
      )}
    </Box>
  );
}
