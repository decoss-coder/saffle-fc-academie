import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PlayerAvatar } from "@/components/player-avatar";
import { EmptyState } from "@/components/empty-state";
import {
  DataTable,
  DataTableBody,
  DataTableHead,
  DataTableTh,
  ListCount,
} from "@/components/data-table";
import { matriculeClass, navActionClass, rowCompact } from "@/lib/dashboard-ui";
import { RESPONSE_STATUS_LABELS } from "@/lib/convocations/constants";
import { PERFORMANCE_LABELS } from "@/lib/notifications/constants";
import { unwrapRelation } from "@/lib/supabase/relation";

export default async function JoueurPresencesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("id, matricule, first_name, last_name, photo_url, team")
    .eq("id", id)
    .maybeSingle();

  if (!player) notFound();

  const playerName = `${player.last_name} ${player.first_name}`;

  const { data: entries } = await supabase
    .from("convocation_entries")
    .select(
      `
      id, response, performance_level, responded_at,
      convocations ( title, event_date, event_type, location )
    `,
    )
    .eq("player_id", id)
    .order("created_at", { ascending: false });

  const trainingEntries = (entries ?? [])
    .map((entry) => ({
      ...entry,
      convocation: unwrapRelation(entry.convocations),
    }))
    .filter((entry) => entry.convocation?.event_type === "training")
    .sort(
      (a, b) =>
        new Date(b.convocation!.event_date).getTime() -
        new Date(a.convocation!.event_date).getTime(),
    );

  return (
    <DashboardShell
      title={`Présences — ${playerName}`}
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Joueurs", href: "/dashboard/joueurs" },
        { label: playerName, href: `/dashboard/joueurs/${player.id}` },
        { label: "Présences" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
      actions={
        <Link
          href={`/dashboard/joueurs/${player.id}`}
          className={navActionClass}
        >
          Retour à la fiche
        </Link>
      }
    >
      <div className="flex items-center gap-4 rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
        <PlayerAvatar
          photoPath={player.photo_url}
          firstName={player.first_name}
          lastName={player.last_name}
          size="md"
        />
        <div>
          <p className="font-semibold text-green-900">{playerName}</p>
          <p className={matriculeClass}>{player.matricule}
            {player.team ? ` · ${player.team}` : ""}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-green-900">
          Historique des entraînements
        </h2>
        {!trainingEntries.length ? (
          <EmptyState message="Aucune séance d'entraînement enregistrée pour ce joueur." />
        ) : (
          <DataTable
            count={
              <ListCount
                count={trainingEntries.length}
                label="séance"
                labelPlural="séances"
              />
            }
          >
            <DataTableHead>
              <tr>
                <DataTableTh>Date</DataTableTh>
                <DataTableTh>Séance</DataTableTh>
                <DataTableTh>Lieu</DataTableTh>
                <DataTableTh>Présence</DataTableTh>
                <DataTableTh>Performance</DataTableTh>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {trainingEntries.map((entry) => (
                <tr key={entry.id}>
                  <td className={`${rowCompact} text-slate-600`}>
                    {new Intl.DateTimeFormat("fr-CI", {
                      weekday: "short",
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(new Date(entry.convocation!.event_date))}
                  </td>
                  <td className={`${rowCompact} font-medium text-green-900`}>
                    {entry.convocation!.title}
                  </td>
                  <td className={`${rowCompact} text-slate-600`}>
                    {entry.convocation!.location ?? "—"}
                  </td>
                  <td className={rowCompact}>
                    {RESPONSE_STATUS_LABELS[entry.response] ?? entry.response}
                  </td>
                  <td className={rowCompact}>
                    {entry.performance_level
                      ? PERFORMANCE_LABELS[entry.performance_level] ??
                        entry.performance_level
                      : "—"}
                  </td>
                </tr>
              ))}
            </DataTableBody>
          </DataTable>
        )}
      </section>
    </DashboardShell>
  );
}
