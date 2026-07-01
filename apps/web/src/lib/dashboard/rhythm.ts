import type { StatusVariant } from "@/lib/dashboard-ui";
import {
  canManagePayments,
  canManagePlayers,
} from "@/lib/auth";

export type ClubRhythmMetric = {
  label: string;
  value: string;
  variant: StatusVariant;
  href: string;
  title?: string;
};

export type RhythmRawCounts = {
  weeklyAbsences: number;
  pendingDocuments: number;
  recoveryRate: number;
  hasMonthDues: boolean;
};

function variantForAbsences(count: number): StatusVariant {
  if (count === 0) return "good";
  if (count <= 3) return "warn";
  return "bad";
}

function variantForDocuments(count: number): StatusVariant {
  if (count === 0) return "good";
  if (count <= 5) return "warn";
  return "bad";
}

function variantForRecovery(rate: number, hasDues: boolean): StatusVariant {
  if (!hasDues) return "good";
  if (rate >= 80) return "good";
  if (rate >= 50) return "warn";
  return "bad";
}

export function buildClubRhythm(
  role: string,
  counts: RhythmRawCounts,
): ClubRhythmMetric[] {
  const metrics: ClubRhythmMetric[] = [];

  if (canManagePlayers(role)) {
    metrics.push({
      label: "Présences",
      value:
        counts.weeklyAbsences === 0
          ? "Stable"
          : `${counts.weeklyAbsences} abs. / ret.`,
      variant: variantForAbsences(counts.weeklyAbsences),
      href: "/dashboard/joueurs",
      title: "Absences et retards sur les entraînements des 7 derniers jours",
    });

    metrics.push({
      label: "Documents",
      value:
        counts.pendingDocuments === 0
          ? "À jour"
          : `${counts.pendingDocuments} en attente`,
      variant: variantForDocuments(counts.pendingDocuments),
      href: "/dashboard/documents?statut=pending",
      title: "Documents joueurs en attente de validation",
    });
  }

  if (canManagePayments(role)) {
    const recoveryLabel = counts.hasMonthDues
      ? `${counts.recoveryRate} %`
      : "—";

    metrics.push({
      label: "Cotisations",
      value: recoveryLabel,
      variant: variantForRecovery(counts.recoveryRate, counts.hasMonthDues),
      href: "/dashboard/paiements?tab=suivi",
      title: counts.hasMonthDues
        ? "Taux de recouvrement des cotisations créées ce mois"
        : "Aucune cotisation créée ce mois",
    });
  }

  return metrics;
}

export function computeRecoveryRate(
  dues: Array<{ amount_due: number; amount_paid: number; status: string }>,
): { recoveryRate: number; hasMonthDues: boolean } {
  const active = dues.filter((d) => d.status !== "cancelled");
  if (!active.length) {
    return { recoveryRate: 100, hasMonthDues: false };
  }

  const totalDue = active.reduce((sum, d) => sum + Number(d.amount_due), 0);
  const totalPaid = active.reduce((sum, d) => sum + Number(d.amount_paid), 0);
  const recoveryRate =
    totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 100;

  return { recoveryRate, hasMonthDues: true };
}
