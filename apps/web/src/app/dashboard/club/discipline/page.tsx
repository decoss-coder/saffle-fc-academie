import Link from "next/link";
import { navActionClass } from "@/lib/dashboard-ui";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DISCIPLINE_STATUS_LABELS } from "@/lib/club-modules/constants";
import { ClubSection } from "@/components/club-ui";
import { ClickableCard } from "@/components/clickable-card";
import { DisciplineForm } from "./discipline-client";
import { unwrapRelation } from "@/lib/supabase/relation";

export default async function DisciplinePage() {
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
      actions={<Link href="/dashboard/club" className={navActionClass}>Retour</Link>}
    >
      <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Seuil automatique : 3 absences/déclins en 30 jours → avertissement + notification (doc. Bakagnoko).
      </p>

      <DisciplineForm players={playerOptions} />

      <ClubSection title="Joueurs sous surveillance">
        <div className="flex flex-wrap gap-2">
          {players?.filter((p) => p.discipline_status !== "active").map((p) => (
            <span key={p.id} className="rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-900">
              {p.last_name} {p.first_name} · {DISCIPLINE_STATUS_LABELS[p.discipline_status]}
            </span>
          )) ?? <span className="text-sm text-green-700">Aucun</span>}
        </div>
      </ClubSection>

      <ClubSection title="Historique">
        <div className="space-y-2">
          {(records ?? []).map((r) => {
            const p = unwrapRelation(r.players);
            const content = (
              <>
                <p className="font-medium text-green-900">
                  {p ? `${p.last_name} ${p.first_name}` : "—"} · {r.incident_type}
                </p>
                <p className="text-slate-600">{r.description}</p>
                <p className="text-xs text-slate-500">
                  {new Intl.DateTimeFormat("fr-CI").format(new Date(r.created_at))}
                </p>
              </>
            );
            return p ? (
              <ClickableCard key={r.id} href={`/dashboard/joueurs/${p.id}`}>
                {content}
              </ClickableCard>
            ) : (
              <article key={r.id} className="rounded-xl border border-green-200 bg-white p-4 text-sm">
                {content}
              </article>
            );
          })}
        </div>
      </ClubSection>
    </DashboardShell>
  );
}
