import Link from "next/link";
import { DashboardShell, requireUser, canManagePlayers } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCategory } from "@/lib/players/constants";
import { CLUB } from "@/lib/club";

export default async function JoueursPage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("id, matricule, first_name, last_name, category, team, birth_date, is_archived")
    .eq("is_archived", false)
    .order("last_name", { ascending: true });

  const canManage = canManagePlayers(profile.role);

  return (
    <DashboardShell
      title="Joueurs"
      subtitle={`Effectif — ${CLUB.name}`}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
      actions={
        canManage ? (
          <Link
            href="/dashboard/joueurs/nouveau"
            className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-zinc-950 transition hover:bg-emerald-400"
          >
            Nouveau joueur
          </Link>
        ) : undefined
      }
    >
      {!players?.length ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-10 text-center">
          <p className="text-zinc-300">Aucun joueur enregistré pour le moment.</p>
          {canManage && (
            <Link
              href="/dashboard/joueurs/nouveau"
              className="mt-4 inline-flex rounded-full bg-emerald-500 px-5 py-2 text-sm font-medium text-zinc-950"
            >
              Ajouter le premier joueur
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <table className="min-w-full divide-y divide-zinc-800 text-sm">
            <thead className="bg-zinc-900/80 text-left text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Matricule</th>
                <th className="px-4 py-3 font-medium">Joueur</th>
                <th className="px-4 py-3 font-medium">Catégorie</th>
                <th className="px-4 py-3 font-medium">Équipe</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/40">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3 font-mono text-emerald-400">
                    {player.matricule}
                  </td>
                  <td className="px-4 py-3">
                    {player.last_name} {player.first_name}
                  </td>
                  <td className="px-4 py-3">{formatCategory(player.category)}</td>
                  <td className="px-4 py-3 text-zinc-400">{player.team ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/dashboard/joueurs/${player.id}`}
                      className="text-emerald-400 hover:underline"
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
    </DashboardShell>
  );
}
