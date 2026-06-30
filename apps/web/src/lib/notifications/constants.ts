export const PERFORMANCE_LEVELS = [
  { value: "excellent", label: "Excellente" },
  { value: "satisfactory", label: "Satisfaisante" },
  { value: "needs_improvement", label: "À améliorer" },
] as const;

export const PERFORMANCE_LABELS: Record<string, string> = {
  excellent: "Excellente",
  satisfactory: "Satisfaisante",
  needs_improvement: "À améliorer",
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  absence: "Absence",
  late: "Retard",
  performance: "Performance",
  payment_overdue: "Cotisation",
  general: "Information",
};
