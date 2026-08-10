import TextField from "@mui/material/TextField";
import type { TextFieldProps } from "@mui/material/TextField";

export default function AtlasInput(props: TextFieldProps) {
  return (
    <TextField
      fullWidth
      size="small"
      {...props}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: 3,
          height: 44,
        },

        ...props.sx,
      }}
    />
  );
}