import type { StatusVariant } from "@/lib/dashboard-ui";

export const SALARY_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  cancelled: "Annulé",
};

export function salaryStatusVariant(status: string): StatusVariant {
  switch (status) {
    case "paid":
      return "good";
    case "cancelled":
      return "neutral";
    default:
      return "warn";
  }
}

export function formatMonthLabel(periodMonth: string) {
  return new Intl.DateTimeFormat("fr-CI", {
    month: "long",
    year: "numeric",
  }).format(new Date(periodMonth));
}
