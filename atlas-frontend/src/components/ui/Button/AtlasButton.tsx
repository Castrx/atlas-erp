import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";

export default function AtlasButton({
  children,
  ...props
}: ButtonProps) {
  return (
    <Button
      disableElevation
      variant="contained"
      {...props}
      sx={{
        height: 44,
        borderRadius: 3,
        fontWeight: 600,
        fontSize: 14,
        boxShadow: "none",

        "&:hover": {
          boxShadow: "none",
        },

        ...props.sx,
      }}
    >
      {children}
    </Button>
  );
}