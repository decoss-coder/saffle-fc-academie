import Link from "next/link";
import { DashboardShell, requireUser, canManagePlayers } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCategory, PLAYER_GROUPS } from "@/lib/players/constants";
import { CLUB } from "@/lib/club";
import { PlayerListTabs } from "@/components/player-list-tabs";

const DEFAULT_GROUP = PLAYER_GROUPS[0].team;

function resolveGroup(groupe?: string) {
  const match = PLAYER_GROUPS.find((g) => g.team === groupe);
  return match?.team ?? DEFAULT_GROUP;
}

export default async function JoueursPage({
  searchParams,
}: {
  searchParams: Promise<{ groupe?: string }>;
}) {
  const params = await searchParams;
  const activeTeam = resolveGroup(params.groupe);

  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("id, matricule, first_name, last_name, category, team, birth_date, is_archived")
    .eq("is_archived", false)
    .order("last_name", { ascending: true });

  const allPlayers = players ?? [];
  const counts = Object.fromEntries(
    PLAYER_GROUPS.map((g) => [
      g.team,
      allPlayers.filter((p) => p.team === g.team).length,
    ]),
  );
  const filtered = allPlayers.filter((p) => p.team === activeTeam);
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
      <PlayerListTabs activeTeam={activeTeam} counts={counts} />

      <div className="mt-4">
      {!filtered.length ? (
        <div className="rounded-2xl border border-dashed border-green-300 bg-white p-10 text-center">
          <p className="text-green-800">
            Aucun joueur dans {activeGroup?.label ?? activeTeam} pour le moment.
          </p>
          {canManage && (
            <Link
              href={`/dashboard/joueurs/nouveau?groupe=${encodeURIComponent(activeTeam)}`}
              className="mt-4 inline-flex rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white"
            >
              Ajouter un joueur
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-green-100 text-sm">
            <thead className="bg-green-800 text-left text-green-100">
              <tr>
                <th className="px-4 py-3 font-medium">Matricule</th>
                <th className="px-4 py-3 font-medium">Joueur</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-100">
              {filtered.map((player) => (
                <tr key={player.id} className="hover:bg-green-50">
                  <td className="px-4 py-3 font-mono text-green-700">
                    {player.matricule}
                  </td>
                  <td className="px-4 py-3 font-medium text-green-900">
                    {player.last_name} {player.first_name}
                  </td>
                  <td className="px-4 py-3">{formatCategory(player.category)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/joueurs/${player.id}`}
                      className="font-medium text-green-800 hover:underline"
                    >
                      Voir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </DashboardShell>
  );
}
