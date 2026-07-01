import Link from "next/link";
import { Suspense } from "react";
import { navActionClass, primaryActionClass } from "@/lib/dashboard-ui";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DISCIPLINE_STATUS_LABELS } from "@/lib/club-modules/constants";
import { ClubSection } from "@/components/club-ui";
import { ClubModuleTabs, resolveClubTab } from "@/components/club-module-tabs";
import { InfoBanner } from "@/components/info-banner";
import { ClickableCard } from "@/components/clickable-card";
import { EmptyState } from "@/components/empty-state";
import { DisciplineForm } from "./discipline-client";
import { unwrapRelation } from "@/lib/supabase/relation";

const TABS = ["suivi", "enregistrer", "historique"] as const;

export default async function DisciplinePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = resolveClubTab(params.tab, [...TABS], "suivi");

  const { profile } = await requireStaff();
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name, matricule, discipline_status, team")
    .eq("is_archived", false)
    .order("last_name");

  const { data: records } = await supabase
    .from("player_discipline_records")
    .select("*, players(id, first_name, last_name, team)")
    .order("created_at", { ascending: false })
    .limit(50);

  const playerOptions =
    players?.map((p) => ({
      id: p.id,
      label: `${p.last_name} ${p.first_name}`,
      discipline_status: p.discipline_status,
    })) ?? [];

  const watched =
    players?.filter((p) => p.discipline_status !== "active") ?? [];

  return (
    <DashboardShell
      title="Discipline"
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Vie du club", href: "/dashboard/club" },
        { label: "Discipline" },
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={
        activeTab !== "enregistrer" ? (
          <Link
            href="/dashboard/club/discipline?tab=enregistrer"
            className={primaryActionClass}
          >
            Nouvel enregistrement
          </Link>
        ) : (
          <Link href="/dashboard/club" className={navActionClass}>
            Retour
          </Link>
        )
      }
    >
      <Suspense fallback={<div className="h-10" />}>
        <ClubModuleTabs
          ariaLabel="Discipline"
          defaultTab="suivi"
          activeTab={activeTab}
          tabs={[
            { id: "suivi", label: "Surveillance", count: watched.length },
            { id: "enregistrer", label: "Enregistrer" },
            { id: "historique", label: "Historique", count: records?.length ?? 0 },
          ]}
        />
      </Suspense>

      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Seuil automatique : 3 absences/déclins en 30 jours → avertissement +
        notification (doc. Bakagnoko).
      </p>

      {activeTab === "enregistrer" ? (
        <div className="max-w-xl space-y-4">
          <InfoBanner title="Nouvel enregistrement">
            <p>
              Documentez un avertissement, une absence, un encouragement ou
              changez le statut disciplinaire d&apos;un joueur.
            </p>
          </InfoBanner>
          <DisciplineForm players={playerOptions} />
        </div>
      ) : null}

      {activeTab === "suivi" ? (
        <ClubSection title="Joueurs sous surveillance">
          {!watched.length ? (
            <EmptyState message="Aucun joueur sous surveillance actuellement." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {watched.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/joueurs/${p.id}`}
                  className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-900 transition hover:bg-amber-200"
                >
                  {p.last_name} {p.first_name} ·{" "}
                  {DISCIPLINE_STATUS_LABELS[p.discipline_status]}
                </Link>
              ))}
            </div>
          )}
        </ClubSection>
      ) : null}

      {activeTab === "historique" ? (
        <ClubSection title="Historique">
          {!records?.length ? (
            <EmptyState message="Aucun enregistrement disciplinaire." />
          ) : (
            <div className="space-y-2">
              {records.map((r) => {
                const p = unwrapRelation(r.players);
                const content = (
                  <>
                    <p className="font-medium text-green-900">
                      {p ? `${p.last_name} ${p.first_name}` : "—"} ·{" "}
                      {r.incident_type}
                    </p>
                    <p className="text-slate-600">{r.description}</p>
                    <p className="text-xs text-slate-500">
                      {new Intl.DateTimeFormat("fr-CI").format(
                        new Date(r.created_at),
                      )}
                    </p>
                  </>
                );
                return p ? (
                  <ClickableCard key={r.id} href={`/dashboard/joueurs/${p.id}`}>
                    {content}
                  </ClickableCard>
                ) : (
                  <article
                    key={r.id}
                    className="rounded-xl border border-green-200 bg-white p-4 text-sm"
                  >
                    {content}
                  </article>
                );
              })}
            </div>
          )}
        </ClubSection>
      ) : null}
    </DashboardShell>
  );
}
