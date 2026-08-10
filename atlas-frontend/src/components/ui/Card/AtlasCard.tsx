import { Card } from "@mui/material";

import type { AtlasCardProps } from "./AtlasCard.types";

export function AtlasCard({ children }: AtlasCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: "1px solid #E2E8F0",
        p: 3,
      }}
    >
      {children}
    </Card>
  );
}