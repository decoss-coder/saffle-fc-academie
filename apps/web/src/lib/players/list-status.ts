import { formatRelativeDate, type StatusVariant } from "@/lib/dashboard-ui";

export type { StatusVariant };

export type PlayerListStatus = {
  label: string;
  variant: StatusVariant;
  title?: string;
};

type DueRow = {
  status: string;
  remaining_amount: number | null;
};

type AttendanceRow = {
  response: string;
  sessionTitle?: string;
  sessionDate?: string;
};

export function summarizePaymentStatus(dues: DueRow[]): PlayerListStatus {
  const active = dues.filter((d) => d.status !== "cancelled");

  if (!active.length) {
    return {
      label: "Aucune",
      variant: "neutral",
      title: "Aucune cotisation enregistrée",
    };
  }

  if (active.some((d) => d.status === "overdue")) {
    return {
      label: "En retard",
      variant: "bad",
      title: "Au moins une cotisation est en retard",
    };
  }

  const unpaid = active.filter(
    (d) =>
      d.status === "pending" ||
      d.status === "partial" ||
      Number(d.remaining_amount ?? 0) > 0,
  );

  if (!unpaid.length) {
    return {
      label: "À jour",
      variant: "good",
      title: "Toutes les cotisations sont réglées",
    };
  }

  if (unpaid.some((d) => d.status === "partial")) {
    return {
      label: "Partiel",
      variant: "warn",
      title: "Paiement partiel en cours",
    };
  }

  return {
    label: "En attente",
    variant: "warn",
    title: "Cotisation non payée",
  };
}

const ATTENDANCE_LABELS: Record<string, { label: string; variant: StatusVariant }> = {
  confirmed: { label: "Présent", variant: "good" },
  absent: { label: "Absent", variant: "bad" },
  late: { label: "Retard", variant: "warn" },
  declined: { label: "Décliné", variant: "bad" },
  pending: { label: "Non renseigné", variant: "neutral" },
};

export function summarizeAttendanceStatus(
  attendance?: AttendanceRow | null,
): PlayerListStatus {
  if (!attendance) {
    return {
      label: "Aucune",
      variant: "neutral",
      title: "Aucune séance d'entraînement passée enregistrée",
    };
  }

  const mapped =
    ATTENDANCE_LABELS[attendance.response] ?? ATTENDANCE_LABELS.pending;
  const relative = attendance.sessionDate
    ? formatRelativeDate(attendance.sessionDate)
    : "";

  return {
    label: relative ? `${mapped.label} · ${relative}` : mapped.label,
    variant: mapped.variant,
    title: attendance.sessionTitle
      ? `Dernière séance : ${attendance.sessionTitle}${relative ? ` (${relative})` : ""}`
      : mapped.label,
  };
}

export { STATUS_VARIANT_CLASSES } from "@/lib/dashboard-ui";
