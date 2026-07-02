import type { StatusVariant } from "@/lib/dashboard-ui";
import type { UpcomingEvent } from "@/lib/dashboard/events";
import type { ClubRhythmMetric } from "@/lib/dashboard/rhythm";
import {
  canManageConvocations,
  canManagePayments,
  canManagePhones,
  canManagePlayers,
  canManageClub,
} from "@/lib/auth";

export type AlertPriority = "critical" | "high" | "normal";

export type DashboardAlert = {
  id: string;
  priority: AlertPriority;
  variant: StatusVariant;
  title: string;
  detail?: string;
  href: string;
  module: string;
  count: number;
};

export type DashboardKpi = {
  label: string;
  value: string | number;
};

export type DashboardSnapshot = {
  kpis: DashboardKpi[];
  alerts: DashboardAlert[];
  upcomingEvents: UpcomingEvent[];
  rhythm: ClubRhythmMetric[];
  quickActions: { label: string; href: string }[];
};

export type RawAlertCounts = {
  pendingWavePayments: number;
  pendingConvocationResponses: number;
  pendingDocuments: number;
  unreadNotifications: number;
  overdueDues: number;
  expiringMedicalCerts: number;
  unactivatedMembers: number;
  unactivatedParents: number;
  activePlayers: number;
  linkedChildren: number;
  parentPendingConvocations: number;
  parentPendingDues: number;
};

const PRIORITY_ORDER: Record<AlertPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
};

export function buildStaffAlerts(
  role: string,
  counts: RawAlertCounts,
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  if (canManagePayments(role) && counts.pendingWavePayments > 0) {
    alerts.push({
      id: "wave-pending",
      priority: "critical",
      variant: "bad",
      title: `${counts.pendingWavePayments} paiement(s) Wave à valider`,
      detail: "Contrôle trésorerie requis",
      href: "/dashboard/paiements?tab=suivi",
      module: "Paiements",
      count: counts.pendingWavePayments,
    });
  }

  if (canManageConvocations(role) && counts.pendingConvocationResponses > 0) {
    alerts.push({
      id: "convocation-pending",
      priority: "high",
      variant: "warn",
      title: `${counts.pendingConvocationResponses} réponse(s) de convocation en attente`,
      detail: "Les parents n'ont pas encore répondu",
      href: "/dashboard/convocations",
      module: "Convocations",
      count: counts.pendingConvocationResponses,
    });
  }

  if (canManagePlayers(role) && counts.pendingDocuments > 0) {
    alerts.push({
      id: "docs-pending",
      priority: "high",
      variant: "warn",
      title: `${counts.pendingDocuments} document(s) à valider`,
      href: "/dashboard/documents?statut=pending",
      module: "Documents",
      count: counts.pendingDocuments,
    });
  }

  if (canManagePayments(role) && counts.overdueDues > 0) {
    alerts.push({
      id: "dues-overdue",
      priority: "high",
      variant: "bad",
      title: `${counts.overdueDues} cotisation(s) en retard`,
      detail: "À relancer dans le module paiements",
      href: "/dashboard/paiements?tab=suivi",
      module: "Paiements",
      count: counts.overdueDues,
    });
  }

  if (canManageClub(role) && counts.expiringMedicalCerts > 0) {
    alerts.push({
      id: "medical-expiring",
      priority: "high",
      variant: "warn",
      title: `${counts.expiringMedicalCerts} certificat(s) médical(aux) à renouveler`,
      detail: "Expiration dans les 30 prochains jours",
      href: "/dashboard/club/medical",
      module: "Médical",
      count: counts.expiringMedicalCerts,
    });
  }

  if (canManagePlayers(role) && counts.unactivatedParents > 0) {
    alerts.push({
      id: "parents-unactivated",
      priority: "normal",
      variant: "neutral",
      title: `${counts.unactivatedParents} parent(s) sans compte activé`,
      detail: "Inviter à activer via /activer",
      href: "/dashboard/parents?statut=en-attente",
      module: "Parents",
      count: counts.unactivatedParents,
    });
  }

  if (canManagePhones(role) && counts.unactivatedMembers > 0) {
    alerts.push({
      id: "staff-unactivated",
      priority: "normal",
      variant: "neutral",
      title: `${counts.unactivatedMembers} agent(s) staff sans compte activé`,
      detail: "Inviter à activer via /activer",
      href: "/dashboard/admin/agents",
      module: "Agents",
      count: counts.unactivatedMembers,
    });
  }

  if (counts.unreadNotifications > 0) {
    alerts.push({
      id: "notifications",
      priority: "normal",
      variant: "neutral",
      title: `${counts.unreadNotifications} notification(s) non lue(s)`,
      href: "/dashboard/notifications",
      module: "Notifications",
      count: counts.unreadNotifications,
    });
  }

  return alerts.sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      b.count - a.count,
  );
}

export function buildParentAlerts(counts: RawAlertCounts): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  if (counts.parentPendingConvocations > 0) {
    alerts.push({
      id: "parent-convocations",
      priority: "high",
      variant: "warn",
      title: `${counts.parentPendingConvocations} convocation(s) sans réponse`,
      detail: "Merci de confirmer la présence de votre enfant",
      href: "/dashboard/parent/convocations",
      module: "Convocations",
      count: counts.parentPendingConvocations,
    });
  }

  if (counts.parentPendingDues > 0) {
    alerts.push({
      id: "parent-dues",
      priority: "high",
      variant: "warn",
      title: `${counts.parentPendingDues} cotisation(s) à régler`,
      href: "/dashboard/parent/paiements",
      module: "Paiements",
      count: counts.parentPendingDues,
    });
  }

  if (counts.unreadNotifications > 0) {
    alerts.push({
      id: "notifications",
      priority: "normal",
      variant: "neutral",
      title: `${counts.unreadNotifications} notification(s) non lue(s)`,
      href: "/dashboard/notifications",
      module: "Notifications",
      count: counts.unreadNotifications,
    });
  }

  return alerts.sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      b.count - a.count,
  );
}

export function buildStaffKpis(
  role: string,
  counts: RawAlertCounts,
  alertCount: number,
): DashboardKpi[] {
  const kpis: DashboardKpi[] = [];

  if (canManagePlayers(role)) {
    kpis.push({
      label: "Joueurs actifs",
      value: counts.activePlayers,
    });
  }

  kpis.push({
    label: "Alertes ouvertes",
    value: alertCount,
  });

  if (canManagePayments(role)) {
    kpis.push({
      label: "Wave en attente",
      value: counts.pendingWavePayments,
    });
  }

  if (canManagePlayers(role)) {
    kpis.push({
      label: "Docs à valider",
      value: counts.pendingDocuments,
    });
  }

  if (canManagePlayers(role)) {
    kpis.push({
      label: "Parents non activés",
      value: counts.unactivatedParents,
    });
  }

  if (canManagePhones(role)) {
    kpis.push({
      label: "Agents non activés",
      value: counts.unactivatedMembers,
    });
  }

  return kpis;
}

export function buildParentKpis(
  counts: RawAlertCounts,
  alertCount: number,
): DashboardKpi[] {
  return [
    { label: "Enfants liés", value: counts.linkedChildren },
    { label: "Réponses attendues", value: counts.parentPendingConvocations },
    { label: "Cotisations à suivre", value: counts.parentPendingDues },
    { label: "Alertes ouvertes", value: alertCount },
  ];
}

export function buildStaffQuickActions(role: string) {
  return [
    ...(canManagePlayers(role)
      ? [
          { label: "Ajouter un joueur", href: "/dashboard/joueurs/nouveau" },
          { label: "Gérer les documents", href: "/dashboard/documents" },
        ]
      : []),
    ...(canManageConvocations(role)
      ? [{ label: "Créer une convocation", href: "/dashboard/convocations" }]
      : []),
    ...(canManagePayments(role)
      ? [{ label: "Contrôler les paiements", href: "/dashboard/paiements" }]
      : []),
  ];
}

export function buildParentQuickActions() {
  return [
    { label: "Mes enfants", href: "/dashboard/parent" },
    { label: "Convocations", href: "/dashboard/parent/convocations" },
    { label: "Paiements", href: "/dashboard/parent/paiements" },
  ];
}
