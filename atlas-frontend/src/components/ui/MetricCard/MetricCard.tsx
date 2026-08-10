import {
  Card,
  CardContent,
  Stack,
  Typography,
  Box,
} from "@mui/material";

import type { MetricCardProps } from "./MetricCard.types";

export function MetricCard({
  title,
  value,
  icon,
  color = "#2563EB",
}: MetricCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid #E5E7EB",
        transition: "box-shadow 0.2s, border-color 0.2s",

        "&:hover": {
          borderColor: "#CBD5E1",
          boxShadow: "0 4px 16px rgba(15, 23, 42, 0.06)",
        },
      }}
    >
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {title}
            </Typography>

            <Typography
              variant="h4"
              fontWeight={700}
              mt={1}
            >
              {value}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: color,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}