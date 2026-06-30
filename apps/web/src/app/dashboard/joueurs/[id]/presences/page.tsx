import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PlayerAvatar } from "@/components/player-avatar";
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
      title={`Présences — ${player.last_name} ${player.first_name}`}
      subtitle={player.matricule}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
      actions={
        <Link
          href={`/dashboard/joueurs/${player.id}`}
          className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800 hover:bg-green-50"
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
          <p className="font-semibold text-green-900">
            {player.last_name} {player.first_name}
          </p>
          <p className="text-sm text-green-700">
            {player.matricule}
            {player.team ? ` · ${player.team}` : ""}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-green-900">
          Historique des entraînements
        </h2>
        {!trainingEntries.length ? (
          <p className="rounded-2xl border border-dashed border-green-300 bg-white p-6 text-sm text-green-700">
            Aucune séance d&apos;entraînement enregistrée pour ce joueur.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-green-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-green-800 text-green-100">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Séance</th>
                  <th className="px-4 py-3 text-left">Lieu</th>
                  <th className="px-4 py-3 text-left">Présence</th>
                  <th className="px-4 py-3 text-left">Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                {trainingEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 text-green-700">
                      {new Intl.DateTimeFormat("fr-CI", {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(entry.convocation!.event_date))}
                    </td>
                    <td className="px-4 py-3 font-medium text-green-900">
                      {entry.convocation!.title}
                    </td>
                    <td className="px-4 py-3 text-green-700">
                      {entry.convocation!.location ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {RESPONSE_STATUS_LABELS[entry.response] ?? entry.response}
                    </td>
                    <td className="px-4 py-3">
                      {entry.performance_level
                        ? PERFORMANCE_LABELS[entry.performance_level] ??
                          entry.performance_level
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  );
}
