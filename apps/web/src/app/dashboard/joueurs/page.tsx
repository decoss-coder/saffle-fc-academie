import Link from "next/link";
import { DashboardShell, requireUser, canManagePlayers } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCategory, PLAYER_GROUPS } from "@/lib/players/constants";
import {
  summarizeAttendanceStatus,
  summarizePaymentStatus,
} from "@/lib/players/list-status";
import { CLUB } from "@/lib/club";
import { PlayerListTabs } from "@/components/player-list-tabs";
import { PlayerListSearch } from "@/components/player-list-search";
import { PlayerAvatar } from "@/components/player-avatar";
import { PlayerStatusBadge } from "@/components/player-status-badge";
import { unwrapRelation } from "@/lib/supabase/relation";

const DEFAULT_GROUP = PLAYER_GROUPS[0].team;

function resolveGroup(groupe?: string) {
  const match = PLAYER_GROUPS.find((g) => g.team === groupe);
  return match?.team ?? DEFAULT_GROUP;
}

function matchesSearch(
  player: {
    first_name: string;
    last_name: string;
    matricule: string;
  },
  query?: string,
) {
  const needle = query?.trim().toLowerCase();
  if (!needle) return true;

  const fullName = `${player.last_name} ${player.first_name}`.toLowerCase();
  return (
    player.first_name.toLowerCase().includes(needle) ||
    player.last_name.toLowerCase().includes(needle) ||
    player.matricule.toLowerCase().includes(needle) ||
    fullName.includes(needle)
  );
}

function buildLatestAttendance(
  entries: Array<{
    player_id: string;
    response: string;
    convocations:
      | { event_type: string; event_date: string; title: string }
      | { event_type: string; event_date: string; title: string }[]
      | null;
  }>,
) {
  const latestByPlayer = new Map<
    string,
    { response: string; sessionTitle: string; sessionDate: string }
  >();
  const now = Date.now();

  for (const entry of entries) {
    const convocation = unwrapRelation(entry.convocations);

    if (!convocation || convocation.event_type !== "training") continue;
    if (new Date(convocation.event_date).getTime() > now) continue;

    const existing = latestByPlayer.get(entry.player_id);
    if (
      !existing ||
      new Date(convocation.event_date).getTime() >
        new Date(existing.sessionDate).getTime()
    ) {
      latestByPlayer.set(entry.player_id, {
        response: entry.response,
        sessionTitle: convocation.title,
        sessionDate: convocation.event_date,
      });
    }
  }

  return latestByPlayer;
}

export default async function JoueursPage({
  searchParams,
}: {
  searchParams: Promise<{ groupe?: string; q?: string }>;
}) {
  const params = await searchParams;
  const activeTeam = resolveGroup(params.groupe);
  const searchQuery = params.q?.trim() ?? "";

  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select(
      "id, matricule, first_name, last_name, category, team, birth_date, is_archived, photo_url",
    )
    .eq("is_archived", false)
    .order("last_name", { ascending: true });

  const allPlayers = players ?? [];
  const counts = Object.fromEntries(
    PLAYER_GROUPS.map((g) => [
      g.team,
      allPlayers.filter((p) => p.team === g.team).length,
    ]),
  );

  const teamPlayers = allPlayers.filter((p) => p.team === activeTeam);
  const filtered = teamPlayers.filter((p) => matchesSearch(p, searchQuery));
  const playerIds = teamPlayers.map((p) => p.id);

  const { data: dues } = playerIds.length
    ? await supabase
        .from("player_dues")
        .select("player_id, status, remaining_amount")
        .in("player_id", playerIds)
    : { data: [] };

  const { data: attendanceEntries } = playerIds.length
    ? await supabase
        .from("convocation_entries")
        .select(
          `
          player_id, response,
          convocations ( event_type, event_date, title )
        `,
        )
        .in("player_id", playerIds)
    : { data: [] };

  const duesByPlayer = new Map<string, typeof dues>();
  for (const due of dues ?? []) {
    const list = duesByPlayer.get(due.player_id) ?? [];
    list.push(due);
    duesByPlayer.set(due.player_id, list);
  }

  const attendanceByPlayer = buildLatestAttendance(attendanceEntries ?? []);
  const activeGroup = PLAYER_GROUPS.find((g) => g.team === activeTeam);
  const canManage = canManagePlayers(profile.role);

  return (
    <DashboardShell
      title="Joueurs"
      subtitle={`${activeGroup?.label ?? activeTeam} — ${CLUB.name}`}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
      actions={
        canManage ? (
          <Link
            href={`/dashboard/joueurs/nouveau?groupe=${encodeURIComponent(activeTeam)}`}
            className="rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Nouveau joueur
          </Link>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3 border-b border-green-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <PlayerListTabs
          activeTeam={activeTeam}
          counts={counts}
          searchQuery={searchQuery || undefined}
        />
        <PlayerListSearch
          activeTeam={activeTeam}
          defaultQuery={searchQuery}
        />
      </div>

      <div className="mt-4">
        {!filtered.length ? (
          <div className="rounded-2xl border border-dashed border-green-300 bg-white p-10 text-center">
            <p className="text-green-800">
              {searchQuery
                ? `Aucun joueur trouvé pour « ${searchQuery} ».`
                : `Aucun joueur dans ${activeGroup?.label ?? activeTeam} pour le moment.`}
            </p>
            {canManage && !searchQuery && (
              <Link
                href={`/dashboard/joueurs/nouveau?groupe=${encodeURIComponent(activeTeam)}`}
                className="mt-4 inline-flex rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white"
              >
                Ajouter un joueur
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-green-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-green-100 text-sm">
              <thead className="bg-green-800 text-left text-green-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Photo</th>
                  <th className="px-4 py-3 font-medium">Matricule</th>
                  <th className="px-4 py-3 font-medium">Joueur</th>
                  <th className="px-4 py-3 font-medium">Catégorie</th>
                  <th className="px-4 py-3 font-medium">Cotisation</th>
                  <th className="px-4 py-3 font-medium">Dernière séance</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-100">
                {filtered.map((player) => {
                  const paymentStatus = summarizePaymentStatus(
                    duesByPlayer.get(player.id) ?? [],
                  );
                  const attendanceStatus = summarizeAttendanceStatus(
                    attendanceByPlayer.get(player.id),
                  );

                  return (
                    <tr key={player.id} className="hover:bg-green-50">
                      <td className="px-4 py-3">
                        <PlayerAvatar
                          photoPath={player.photo_url}
                          firstName={player.first_name}
                          lastName={player.last_name}
                          size="sm"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-green-700">
                        {player.matricule}
                      </td>
                      <td className="px-4 py-3 font-medium text-green-900">
                        {player.last_name} {player.first_name}
                      </td>
                      <td className="px-4 py-3">
                        {formatCategory(player.category)}
                      </td>
                      <td className="px-4 py-3">
                        <PlayerStatusBadge status={paymentStatus} />
                      </td>
                      <td className="px-4 py-3">
                        <PlayerStatusBadge status={attendanceStatus} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/joueurs/${player.id}`}
                          className="font-medium text-green-800 hover:underline"
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
