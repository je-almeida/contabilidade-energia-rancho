import { MONTHS } from "./types";
import { centsToReais } from "./money";

const moneyFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFmt = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 4,
  minimumFractionDigits: 0,
});

export function formatMoneyCents(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || !Number.isFinite(cents)) {
    return "—";
  }
  return moneyFmt.format(centsToReais(cents));
}

export function formatRate(
  rate: number | null | undefined,
  decimals = 6,
): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) {
    return "—";
  }
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(rate);
}

export function formatReading(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "—";
  }
  return numberFmt.format(value);
}

export function formatCompetency(year: number, month: number): string {
  return `${MONTHS[month - 1] ?? month}/${year}`;
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export function statusLabel(status: string): string {
  if (status === "open") return "Aberta";
  if (status === "closed") return "Fechada";
  if (status === "cancelled") return "Cancelada";
  if (status === "active") return "Ativo";
  if (status === "inactive") return "Inativo";
  return status;
}
