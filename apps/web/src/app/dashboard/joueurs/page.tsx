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
            className="rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-700"
          >
            Nouveau joueur
          </Link>
        ) : undefined
      }
    >
      {!players?.length ? (
        <div className="rounded-2xl border border-dashed border-green-300 bg-white p-10 text-center">
          <p className="text-green-800">Aucun joueur enregistré pour le moment.</p>
          {canManage && (
            <Link
              href="/dashboard/joueurs/nouveau"
              className="mt-4 inline-flex rounded-full bg-green-800 px-5 py-2 text-sm font-medium text-white"
            >
              Ajouter le premier joueur
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
                <th className="px-4 py-3 font-medium">Équipe</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-100">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-green-50">
                  <td className="px-4 py-3 font-mono text-green-700">
                    {player.matricule}
                  </td>
                  <td className="px-4 py-3">
                    {player.last_name} {player.first_name}
                  </td>
                  <td className="px-4 py-3">{formatCategory(player.category)}</td>
                  <td className="px-4 py-3 text-green-700">{player.team ?? "—"}</td>
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
    </DashboardShell>
  );
}
