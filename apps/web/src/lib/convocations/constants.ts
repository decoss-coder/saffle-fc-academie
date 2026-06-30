export const CONVOCATION_EVENT_TYPES = [
  { value: "training", label: "Entraînement" },
  { value: "match", label: "Match" },
  { value: "other", label: "Autre" },
] as const;

export const CONVOCATION_RESPONSES = [
  { value: "confirmed", label: "Je confirme" },
  { value: "declined", label: "Je décline" },
  { value: "late", label: "Je serai en retard" },
  { value: "absent", label: "Absent(e)" },
] as const;

export const RESPONSE_STATUS_LABELS: Record<string, string> = {
  pending: "À répondre",
  confirmed: "Confirmé",
  declined: "Décliné",
  late: "En retard",
  absent: "Absent",
};

export function formatEventType(type: string) {
  return CONVOCATION_EVENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("fr-CI", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
