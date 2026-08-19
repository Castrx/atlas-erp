import { Box, Card, CardContent, Typography } from "@mui/material";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DailyRevenue } from "../../types";
import { formatCurrency, formatShortDate } from "../../utils";
import { tokens } from "../../../../core/theme/tokens";

interface SalesChartProps {
  data: DailyRevenue[];
}

export function SalesChart({ data }: SalesChartProps) {
  const chartData = data.map((day) => ({
    date: formatShortDate(day.date),
    total: day.total,
  }));

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid", borderColor: "divider" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Faturamento — últimos 7 dias
        </Typography>

        <Box sx={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.colors.border} vertical={false} />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: tokens.colors.textSecondary }}
                axisLine={{ stroke: tokens.colors.border }}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 12, fill: tokens.colors.textSecondary }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => formatCurrency(value)}
                width={90}
              />

              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Faturamento"]}
                contentStyle={{
                  borderRadius: 8,
                  border: `1px solid ${tokens.colors.border}`,
                  fontSize: 13,
                }}
              />

              <Area
                type="monotone"
                dataKey="total"
                stroke={tokens.colors.primary}
                strokeWidth={2}
                fill={tokens.colors.primary}
                fillOpacity={0.12}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
