import Link from "next/link";
import {
  DashboardShell,
  requireUser,
  isParentRole,
  getLinkedPlayerIds,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import { formatCategory } from "@/lib/players/constants";
import { redirect } from "next/navigation";

export default async function ParentHomePage() {
  const { user, profile } = await requireUser();
  if (!isParentRole(profile.role)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const playerIds = await getLinkedPlayerIds(supabase, user.id);

  const { data: players } = playerIds.length
    ? await supabase
        .from("players")
        .select("id, matricule, first_name, last_name, category, team")
        .in("id", playerIds)
        .eq("is_archived", false)
    : { data: [] };

  return (
    <DashboardShell
      title="Mes enfants"
      subtitle={`Espace parent — ${CLUB.name}`}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      {!players?.length ? (
        <div className="rounded-2xl border border-dashed border-green-300 bg-white p-10 text-center">
          <p className="text-green-800">
            Aucun enfant lié à votre compte pour le moment.
          </p>
          <p className="mt-2 text-sm text-green-700">
            Contactez le club si votre enfant est inscrit avec votre numéro de
            téléphone.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {players.map((player) => (
            <article
              key={player.id}
              className="rounded-2xl border border-green-200 bg-white p-6 shadow-sm"
            >
              <p className="font-mono text-sm text-green-700">{player.matricule}</p>
              <h2 className="mt-1 text-xl font-semibold text-green-900">
                {player.last_name} {player.first_name}
              </h2>
              <p className="mt-2 text-sm text-green-700">
                {formatCategory(player.category)}
                {player.team ? ` · ${player.team}` : ""}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/dashboard/parent/convocations"
                  className="rounded-full border border-green-300 px-4 py-2 text-sm text-green-800 hover:bg-green-50"
                >
                  Convocations
                </Link>
                <Link
                  href="/dashboard/parent/paiements"
                  className="rounded-full bg-green-800 px-4 py-2 text-sm text-white hover:bg-green-700"
                >
                  Paiements
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
