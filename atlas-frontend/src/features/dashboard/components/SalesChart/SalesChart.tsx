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

interface SalesChartProps {
  data: DailyRevenue[];
}

export function SalesChart({ data }: SalesChartProps) {
  const chartData = data.map((day) => ({
    date: formatShortDate(day.date),
    total: day.total,
  }));

  return (
    <Card elevation={0} sx={{ borderRadius: 3, border: "1px solid #E5E7EB" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={700} mb={2}>
          Faturamento — últimos 7 dias
        </Typography>

        <Box sx={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <AreaChart data={chartData} margin={{ left: 8, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />

              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={{ stroke: "#E5E7EB" }}
                tickLine={false}
              />

              <YAxis
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => formatCurrency(value)}
                width={90}
              />

              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Faturamento"]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #E5E7EB",
                  fontSize: 13,
                }}
              />

              <Area
                type="monotone"
                dataKey="total"
                stroke="#2563EB"
                strokeWidth={2}
                fill="#2563EB"
                fillOpacity={0.12}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
}
