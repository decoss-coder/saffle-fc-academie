import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardShell, requireConvocationStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import {
  formatDateTime,
  formatEventType,
  RESPONSE_STATUS_LABELS,
} from "@/lib/convocations/constants";
import { unwrapRelation } from "@/lib/supabase/relation";
import { ConvocationAttendanceForm } from "@/components/convocation-attendance-form";

export default async function ConvocationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireConvocationStaff();
  const supabase = await createClient();

  const { data: convocation } = await supabase
    .from("convocations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!convocation) notFound();

  const { data: entries } = await supabase
    .from("convocation_entries")
    .select(
      `
      id, response, performance_level, response_comment, responded_at,
      players ( first_name, last_name, matricule )
    `,
    )
    .eq("convocation_id", id);

  const pending = entries?.filter((e) => e.response === "pending").length ?? 0;
  const isTraining = convocation.event_type === "training";
  const isPast = new Date(convocation.event_date).getTime() <= Date.now();

  const attendanceEntries =
    entries?.map((entry) => {
      const player = unwrapRelation(entry.players);
      return {
        id: entry.id,
        response: entry.response,
        performanceLevel: entry.performance_level,
        playerName: player
          ? `${player.last_name} ${player.first_name}`
          : "Joueur",
      };
    }) ?? [];

  return (
    <DashboardShell
      title={convocation.title}
      subtitle={formatEventType(convocation.event_type)}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
      actions={
        <Link
          href="/dashboard/convocations"
          className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800 hover:bg-green-50"
        >
          Retour
        </Link>
      }
    >
      <div className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm">
        <p className="text-green-700">{formatDateTime(convocation.event_date)}</p>
        {convocation.location && (
          <p className="mt-1 text-green-800">Lieu : {convocation.location}</p>
        )}
        {convocation.notes && (
          <p className="mt-3 text-sm text-green-700">{convocation.notes}</p>
        )}
        <p className="mt-4 text-sm font-medium text-amber-800">
          {pending} réponse(s) en attente
        </p>
      </div>

      {isTraining && isPast && (
        <ConvocationAttendanceForm
          convocationId={convocation.id}
          isTraining={isTraining}
          entries={attendanceEntries}
        />
      )}

      <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-green-800 text-green-100">
            <tr>
              <th className="px-4 py-3 text-left">Joueur</th>
              <th className="px-4 py-3 text-left">Réponse / Présence</th>
              <th className="px-4 py-3 text-left">Commentaire</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-green-100">
            {entries?.map((entry) => {
              const player = unwrapRelation(entry.players);
              return (
                <tr key={entry.id}>
                  <td className="px-4 py-3">
                    {player
                      ? `${player.last_name} ${player.first_name}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {RESPONSE_STATUS_LABELS[entry.response] ?? entry.response}
                  </td>
                  <td className="px-4 py-3 text-green-700">
                    {entry.response_comment ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </DashboardShell>
  );
}
