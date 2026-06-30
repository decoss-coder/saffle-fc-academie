import Link from "next/link";
import {
  DashboardShell,
  requireUser,
  isParentRole,
  getLinkedPlayerIds,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCategory } from "@/lib/players/constants";
import { redirect } from "next/navigation";
import { PlayerAvatar } from "@/components/player-avatar";
import { ClickableCard } from "@/components/clickable-card";
import { EmptyState } from "@/components/empty-state";
import { matriculeClass } from "@/lib/dashboard-ui";

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
        .select("id, matricule, first_name, last_name, category, team, photo_url")
        .in("id", playerIds)
        .eq("is_archived", false)
    : { data: [] };

  return (
    <DashboardShell
      title="Mes enfants"
      breadcrumbs={[
        { label: "Famille", href: "/dashboard" },
        { label: "Mes enfants" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      {!players?.length ? (
        <EmptyState message="Aucun enfant lié à votre compte pour le moment.">
          <p className="text-sm text-green-700">
            Contactez le club si votre enfant est inscrit avec votre numéro de
            téléphone.
          </p>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {players.map((player) => (
            <div key={player.id} className="space-y-4">
              <ClickableCard href={`/dashboard/joueurs/${player.id}`}>
                <div className="flex items-start gap-4">
                  <PlayerAvatar
                    photoPath={player.photo_url}
                    firstName={player.first_name}
                    lastName={player.last_name}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={matriculeClass}>{player.matricule}</p>
                    <h2 className="mt-1 text-xl font-semibold text-green-900">
                      {player.last_name} {player.first_name}
                    </h2>
                    <p className="mt-2 text-sm text-green-700">
                      {formatCategory(player.category)}
                      {player.team ? ` · ${player.team}` : ""}
                    </p>
                  </div>
                </div>
              </ClickableCard>
              <div className="flex flex-wrap gap-2 px-1">
                <Link
                  href="/dashboard/mes-documents"
                  className="rounded-full border border-green-300 px-4 py-2 text-sm text-green-800 hover:bg-green-50"
                >
                  Documents
                </Link>
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
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
