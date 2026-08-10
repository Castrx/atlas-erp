import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

import type { RecentSale } from "../../types";
import { formatCurrency, formatDateTime } from "../../utils";

interface RecentSalesProps {
  sales: RecentSale[];
}

export function RecentSales({ sales }: RecentSalesProps) {
  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #E5E7EB" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Vendas recentes
        </Typography>

        {sales.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Nenhuma venda registrada ainda.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {sales.map((sale) => (
              <Stack
                key={sale.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {sale.customerName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(sale.createdAt)}
                  </Typography>
                </Box>

                <Typography variant="body2" fontWeight={700}>
                  {formatCurrency(sale.total)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
