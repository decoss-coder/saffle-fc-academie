import type { StatusVariant } from "@/lib/dashboard-ui";

export function formatFcfa(amount: number) {
  return new Intl.NumberFormat("fr-CI", {
    style: "currency",
    currency: "XOF",
    maximumFractionDigits: 0,
  }).format(amount);
}

export const DUE_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  partial: "Partiel",
  paid: "Payé",
  overdue: "En retard",
  cancelled: "Annulé",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "En attente Wave",
  completed: "Confirmé",
  failed: "Échoué",
  cancelled: "Annulé",
  refunded: "Remboursé",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  wave: "Wave",
  cash: "Espèces",
  bank_transfer: "Virement",
  other: "Autre",
};

export const MIN_PAYMENT_FCFA = 100;

export function dueStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "paid":
      return "good";
    case "partial":
      return "warn";
    case "overdue":
      return "bad";
    case "cancelled":
      return "neutral";
    default:
      return "warn";
  }
}

export function paymentStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "completed":
      return "good";
    case "pending":
      return "warn";
    case "failed":
    case "cancelled":
      return "bad";
    default:
      return "neutral";
  }
}
