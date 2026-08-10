const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR");
}

export function formatShortDate(isoDate: string): string {
  // Data pura (yyyy-MM-dd, sem hora) — new Date(iso) interpretaria como
  // UTC-meia-noite e, em fusos negativos (ex.: UTC-3), regrediria um dia
  // ao formatar em horário local. Construímos a partir dos componentes
  // para manter a data exibida igual à recebida da API.
  const [year, month, day] = isoDate.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}
