import Link from "next/link";
import {
  DashboardShell,
  requireUser,
  canManagePlayers,
  canManagePayments,
  canManageConvocations,
  canManagePhones,
  canManageClub,
  isParentRole,
  getLinkedPlayerIds,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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
        breadcrumbs={[
          { label: "Pilotage", href: "/dashboard" },
          { label: "Accueil" },
        ]}
        subtitle="Suivez les enfants, les convocations et les cotisations sans perdre le fil."
        userName={profile.full_name || user.email || "Utilisateur"}
        userRole={role}
      >
        <section className="grid gap-4 lg:grid-cols-3">
          {[
            {
              href: "/dashboard/parent",
              label: "Mes enfants",
              value: playerIds.length,
              detail: "profil(s) lié(s)",
            },
            {
              href: "/dashboard/parent/convocations",
              label: "Convocations",
              value: pendingConvocations ?? 0,
              detail: "réponse(s) attendue(s)",
            },
            {
              href: "/dashboard/parent/paiements",
              label: "Paiements",
              value: pendingDues ?? 0,
              detail: "cotisation(s) à suivre",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-[#dde6d6] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#b7c9ab] hover:shadow-lg"
            >
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <div className="mt-6 flex items-end justify-between gap-4">
                <p className="text-4xl font-semibold tracking-tight text-slate-950">
                  {item.value}
                </p>
                <span className="rounded-full bg-[#eef4e9] px-3 py-1 text-xs font-semibold text-[#245b3a]">
                  Ouvrir
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
            </Link>
          ))}
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
            metric: playerCount ?? 0,
            unit: "actifs",
            status: "Effectif, dossiers et présences",
            tone: "bg-[#eaf1e4] text-[#245b3a]",
          },
        ]
      : []),
    ...(canManageConvocations(role)
      ? [
          {
            title: "Convocations",
            href: "/dashboard/convocations",
            metric: "Match",
            unit: "staff",
            status: "Créer, envoyer et contrôler les réponses",
            tone: "bg-[#edf1f7] text-[#253d63]",
          },
        ]
      : []),
    ...(canManagePayments(role)
      ? [
          {
            title: "Paiements",
            href: "/dashboard/paiements",
            metric: pendingPayments ?? 0,
            unit: "Wave",
            status: "Paiements en attente de validation",
            tone: "bg-[#f7f2e7] text-[#6c4a17]",
          },
        ]
      : []),
    ...(canManagePhones(role)
      ? [
          {
            title: "Accès téléphone",
            href: "/dashboard/admin/telephones",
            metric: "OTP",
            unit: "sécurité",
            status: "Parents et staff autorisés",
            tone: "bg-[#f1ebf6] text-[#57356d]",
          },
        ]
      : []),
    ...(canManageClub(role)
      ? [
          {
            title: "Vie du club",
            href: "/dashboard/club",
            metric: "Club",
            unit: "terrain",
            status: "Logistique, médical, planning et discipline",
            tone: "bg-[#e8f3f1] text-[#1f5b55]",
          },
        ]
      : []),
  ];

  const priorities = [
    {
      label: "Effectif",
      value: `${playerCount ?? 0} joueurs actifs`,
      detail: "Base opérationnelle du club",
    },
    {
      label: "Paiements Wave",
      value: `${pendingPayments ?? 0} en attente`,
      detail: canManagePayments(role)
        ? "À vérifier dans le module paiements"
        : "Accès réservé à la trésorerie",
    },
    {
      label: "Pilotage",
      value: "Vue consolidée",
      detail: "Joueurs, convocations, documents et finances",
    },
  ];

  const quickActions = [
    ...(canManagePlayers(role)
      ? [
          ["Ajouter un joueur", "/dashboard/joueurs/nouveau"],
          ["Gérer les documents", "/dashboard/documents"],
        ]
      : []),
    ...(canManageConvocations(role)
      ? [["Créer une convocation", "/dashboard/convocations"]]
      : []),
    ...(canManagePayments(role)
      ? [["Contrôler les paiements", "/dashboard/paiements"]]
      : []),
  ];

  return (
    <DashboardShell
      title={`Bonjour ${profile.full_name || "!"}`}
      breadcrumbs={[
        { label: "Pilotage", href: "/dashboard" },
        { label: "Accueil" },
      ]}
      subtitle="Une console claire pour décider vite et agir proprement."
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={role}
    >
      <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {modules.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="group rounded-2xl border border-[#dde6d6] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#b7c9ab] hover:shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {item.title}
                </p>
                <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {item.metric}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${item.tone}`}
              >
                {item.unit}
              </span>
            </div>
            <p className="mt-5 min-h-10 text-sm leading-5 text-slate-600">
              {item.status}
            </p>
            <p className="mt-5 text-sm font-semibold text-[#245b3a]">
              Ouvrir le module
            </p>
          </Link>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-2xl border border-[#dde6d6] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
              Priorités
            </p>
            <span className="rounded-full bg-[#eef4e9] px-3 py-1 text-xs font-semibold text-[#245b3a]">
              Aujourd&apos;hui
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {priorities.map((item) => (
              <div
                key={item.label}
                className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-slate-500">
                    {item.label}
                  </p>
                  <p className="text-right text-sm font-semibold text-slate-950">
                    {item.value}
                  </p>
                </div>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </aside>

        <div className="rounded-2xl border border-[#dde6d6] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Rythme club
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {["Présences", "Documents", "Cotisations"].map((label) => (
              <div
                key={label}
                className="rounded-2xl bg-[#f6f8f3] p-4 text-center ring-1 ring-[#e3eadf]"
              >
                <p className="text-xs font-medium text-slate-500">{label}</p>
                <p className="mt-3 text-lg font-semibold text-slate-950">
                  Stable
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#dde6d6] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">
            Actions rapides
          </p>
          <p className="text-sm text-slate-500">
            Accès directs aux opérations les plus fréquentes.
          </p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-2xl border border-[#dde6d6] px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-[#b7c9ab] hover:bg-[#f6f8f3]"
            >
              {label}
            </Link>
          ))}
        </div>
      </section>
    </DashboardShell>
  );
}
