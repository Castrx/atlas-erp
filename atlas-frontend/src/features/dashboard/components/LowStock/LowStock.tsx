import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

import type { LowStockProduct } from "../../types";

interface LowStockProps {
  products: LowStockProduct[];
}

export function LowStock({ products }: LowStockProps) {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #E5E7EB" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Estoque baixo
        </Typography>

        {products.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhum produto abaixo do estoque mínimo.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {products.map((product) => (
              <Stack
                key={product.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {product.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {product.sku}
                  </Typography>
                </Box>

                <Chip
                  label={`${product.stock} / ${product.minimumStock}`}
                  size="small"
                  color="warning"
                  variant="outlined"
                />
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
