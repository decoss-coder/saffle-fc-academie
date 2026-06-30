import Link from "next/link";
import {
  DashboardShell,
  requireUser,
  canManagePlayers,
  canManagePayments,
  canManageConvocations,
  canManagePhones,
  isParentRole,
  getLinkedPlayerIds,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";

export default async function DashboardPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();
  const role = profile.role;

  if (isParentRole(role)) {
    const playerIds = await getLinkedPlayerIds(supabase, user.id);

    const { count: pendingConvocations } = playerIds.length
      ? await supabase
          .from("convocation_entries")
          .select("*", { count: "exact", head: true })
          .in("player_id", playerIds)
          .eq("response", "pending")
      : { count: 0 };

    const { count: pendingDues } = playerIds.length
      ? await supabase
          .from("player_dues")
          .select("*", { count: "exact", head: true })
          .in("player_id", playerIds)
          .in("status", ["pending", "partial", "overdue"])
      : { count: 0 };

    return (
      <DashboardShell
        title={`Bonjour ${profile.full_name || "!"}`}
        subtitle={`Espace parent — ${CLUB.name}`}
        userName={profile.full_name || user.email || "Utilisateur"}
        userRole={role}
      >
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/dashboard/parent"
            className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm transition hover:border-green-400 hover:bg-green-50"
          >
            <h2 className="text-lg font-medium text-green-900">Mes enfants</h2>
            <p className="mt-2 text-sm text-green-700">
              {playerIds.length} enfant(s) lié(s)
            </p>
          </Link>
          <Link
            href="/dashboard/parent/convocations"
            className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm transition hover:border-green-400 hover:bg-green-50"
          >
            <h2 className="text-lg font-medium text-green-900">Convocations</h2>
            <p className="mt-2 text-sm text-green-700">
              {pendingConvocations ?? 0} à traiter
            </p>
          </Link>
          <Link
            href="/dashboard/parent/paiements"
            className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm transition hover:border-green-400 hover:bg-green-50"
          >
            <h2 className="text-lg font-medium text-green-900">Paiements</h2>
            <p className="mt-2 text-sm text-green-700">
              {pendingDues ?? 0} cotisation(s) en cours
            </p>
          </Link>
        </section>
      </DashboardShell>
    );
  }

  const { count: playerCount } = await supabase
    .from("players")
    .select("*", { count: "exact", head: true })
    .eq("is_archived", false);

  const { count: pendingPayments } = canManagePayments(role)
    ? await supabase
        .from("payments")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")
        .eq("payment_method", "wave")
    : { count: 0 };

  const modules = [
    ...(canManagePlayers(role)
      ? [
          {
            title: "Joueurs",
            href: "/dashboard/joueurs",
            status: `${playerCount ?? 0} joueur(s) actif(s)`,
          },
        ]
      : []),
    ...(canManageConvocations(role)
      ? [
          {
            title: "Convocations",
            href: "/dashboard/convocations",
            status: "Créer et suivre les convocations",
          },
        ]
      : []),
    ...(canManagePayments(role)
      ? [
          {
            title: "Paiements",
            href: "/dashboard/paiements",
            status: `${pendingPayments ?? 0} paiement(s) Wave en attente`,
          },
        ]
      : []),
    ...(canManagePhones(role)
      ? [
          {
            title: "Accès téléphone",
            href: "/dashboard/admin/telephones",
            status: "Parents et staff autorisés",
          },
        ]
      : []),
  ];

  return (
    <DashboardShell
      title={`Bonjour ${profile.full_name || "!"}`}
      subtitle={`Tableau de bord — ${CLUB.name}`}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={role}
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm transition hover:border-green-400 hover:bg-green-50"
          >
            <h2 className="text-lg font-medium text-green-900">{item.title}</h2>
            <p className="mt-2 text-sm text-green-700">{item.status}</p>
          </Link>
        ))}
      </section>
    </DashboardShell>
  );
}
