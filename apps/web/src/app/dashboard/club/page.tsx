import Link from "next/link";
import { DashboardShell, requireUser, canManagePlayers, canManagePayments, isParentRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClickableCard } from "@/components/clickable-card";
import { NavIconForHref } from "@/components/nav-icons";

type ModuleDef = {
  href: string;
  label: string;
  desc: string;
  metricKey: string;
};

const STAFF_MODULES: ModuleDef[] = [
  { href: "/dashboard/club/planning", label: "Planning", desc: "Créneaux & heures min.", metricKey: "planning" },
  { href: "/dashboard/club/equipement", label: "Équipement", desc: "Maillots, chaussures, prêts", metricKey: "equipment" },
  { href: "/dashboard/club/discipline", label: "Discipline", desc: "Absences & encouragements", metricKey: "discipline" },
  { href: "/dashboard/club/medical", label: "Médical", desc: "Assurance & certificats", metricKey: "medical" },
  { href: "/dashboard/club/matchs", label: "Matchs & primes", desc: "2 500 / 5 000 FCFA", metricKey: "matchs" },
  { href: "/dashboard/club/interessement", label: "Intéressement", desc: "Répartition par groupe", metricKey: "interessement" },
  { href: "/dashboard/club/logistique", label: "Logistique", desc: "Tondeuse, gym, terrain", metricKey: "logistique" },
  { href: "/dashboard/club/aides", label: "Aides sociales", desc: "Logement & nourriture", metricKey: "aides" },
  { href: "/dashboard/club/transport", label: "Transport", desc: "Demandes déplacements", metricKey: "transport" },
];

function metricLabel(key: string, counts: Record<string, number>): string {
  switch (key) {
    case "planning":
      return `${counts.planning ?? 0} créneau${(counts.planning ?? 0) > 1 ? "x" : ""} actif${(counts.planning ?? 0) > 1 ? "s" : ""}`;
    case "equipment":
      return `${counts.equipment ?? 0} prêt${(counts.equipment ?? 0) > 1 ? "s" : ""} en cours`;
    case "discipline":
      return `${counts.discipline ?? 0} joueur${(counts.discipline ?? 0) > 1 ? "s" : ""} sous surveillance`;
    case "medical":
      return `${counts.medical ?? 0} certificat${(counts.medical ?? 0) > 1 ? "s" : ""} à surveiller`;
    case "matchs":
      return `${counts.matchs ?? 0} match${(counts.matchs ?? 0) > 1 ? "s" : ""} ce mois`;
    case "interessement":
      return `${counts.interessement ?? 0} pool${(counts.interessement ?? 0) > 1 ? "s" : ""} actif${(counts.interessement ?? 0) > 1 ? "s" : ""}`;
    case "logistique":
      return `${counts.logistique ?? 0} tâche${(counts.logistique ?? 0) > 1 ? "s" : ""} ouverte${(counts.logistique ?? 0) > 1 ? "s" : ""}`;
    case "aides":
      return `${counts.aides ?? 0} demande${(counts.aides ?? 0) > 1 ? "s" : ""} en cours`;
    case "transport":
      return `${counts.transport ?? 0} demande${(counts.transport ?? 0) > 1 ? "s" : ""} en attente`;
    default:
      return "";
  }
}

export default async function ClubHubPage() {
  const { profile } = await requireUser();
  const isStaff = canManagePlayers(profile.role);
  const isParent = isParentRole(profile.role);
  const isTreasurer = canManagePayments(profile.role);

  const modules = STAFF_MODULES.filter((m) => {
    if (m.href.includes("matchs") || m.href.includes("interessement")) {
      return isTreasurer || isStaff;
    }
    if (m.href.includes("aides") || m.href.includes("transport")) {
      return isStaff || isParent;
    }
    return isStaff;
  });

  const supabase = await createClient();
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();
  const certLimit = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [
    { count: planning },
    { count: equipment },
    { count: discipline },
    { count: medical },
    { count: matchs },
    { count: interessement },
    { count: logistique },
    { count: aides },
    { count: transport },
  ] = await Promise.all([
    supabase
      .from("training_schedules")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("equipment_inventory")
      .select("*", { count: "exact", head: true })
      .eq("status", "loaned"),
    supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("is_archived", false)
      .neq("discipline_status", "active"),
    supabase
      .from("players")
      .select("*", { count: "exact", head: true })
      .eq("is_archived", false)
      .not("medical_cert_expires_at", "is", null)
      .lte("medical_cert_expires_at", certLimit),
    supabase
      .from("club_matches")
      .select("*", { count: "exact", head: true })
      .gte("match_date", monthStart)
      .lte("match_date", monthEnd),
    supabase
      .from("profit_sharing_pools")
      .select("*", { count: "exact", head: true })
      .neq("status", "closed"),
    supabase
      .from("logistics_tasks")
      .select("*", { count: "exact", head: true })
      .neq("status", "done"),
    supabase
      .from("welfare_requests")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "reviewing"]),
    supabase
      .from("transport_requests")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  const counts: Record<string, number> = {
    planning: planning ?? 0,
    equipment: equipment ?? 0,
    discipline: discipline ?? 0,
    medical: medical ?? 0,
    matchs: matchs ?? 0,
    interessement: interessement ?? 0,
    logistique: logistique ?? 0,
    aides: aides ?? 0,
    transport: transport ?? 0,
  };

  return (
    <DashboardShell
      title="Vie du club"
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Vie du club" },
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <ClickableCard key={mod.href} href={mod.href}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-800">
                <NavIconForHref href={mod.href} className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-green-900">{mod.label}</h2>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {metricLabel(mod.metricKey, counts)}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{mod.desc}</p>
              </div>
            </div>
          </ClickableCard>
        ))}
      </div>
    </DashboardShell>
  );
}
