import Link from "next/link";
import { notFound } from "next/navigation";
import {
  DashboardShell,
  requireUser,
  canManagePlayers,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  formatCategory,
  formatDate,
  formatGender,
} from "@/lib/players/constants";
import { archivePlayer } from "@/app/dashboard/joueurs/actions";

export default async function JoueurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!player) {
    notFound();
  }

  const canManage = canManagePlayers(profile.role);

  const fields = [
    ["Matricule", player.matricule],
    ["Nom complet", `${player.last_name} ${player.first_name}`],
    ["Date de naissance", formatDate(player.birth_date)],
    ["Sexe", formatGender(player.gender)],
    ["Catégorie", formatCategory(player.category)],
    ["Équipe", player.team ?? "—"],
    ["Téléphone", player.phone ?? "—"],
    ["Adresse", player.address ?? "—"],
    ["Père", player.father_name ?? "—"],
    ["Mère", player.mother_name ?? "—"],
    ["Tuteur", player.guardian_name ?? "—"],
    ["Pied fort", player.strong_foot ?? "—"],
    ["Poste principal", player.primary_position ?? "—"],
    ["Poste secondaire", player.secondary_position ?? "—"],
  ] as const;

  return (
    <DashboardShell
      title={`${player.last_name} ${player.first_name}`}
      subtitle={player.matricule}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
      actions={
        <Link
          href="/dashboard/joueurs"
          className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800 transition hover:bg-green-50"
        >
          Retour à la liste
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-green-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-green-700">{label}</p>
            <p className="mt-1 font-medium text-green-900">{value}</p>
          </div>
        ))}
      </div>

      {canManage && !player.is_archived && (
        <form action={archivePlayer} className="pt-4">
          <input type="hidden" name="player_id" value={player.id} />
          <button
            type="submit"
            className="rounded-full border border-red-300 px-5 py-2 text-sm text-red-700 transition hover:bg-red-50"
          >
            Archiver ce joueur
          </button>
        </form>
      )}
    </DashboardShell>
  );
}
