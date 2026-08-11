export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  /** Rótulo do botão de confirmação. Padrão: "Confirmar". */
  confirmLabel?: string;
  /** Rótulo do botão de cancelamento. Padrão: "Cancelar". */
  cancelLabel?: string;
  /** Cor do botão de confirmação — "error" para ações destrutivas. Padrão: "error". */
  confirmColor?: "primary" | "error";
  /** Mostra o estado "processando" e desabilita os dois botões. */
  confirming?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}
