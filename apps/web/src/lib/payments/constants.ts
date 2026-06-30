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
