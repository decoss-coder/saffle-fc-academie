import Link from "next/link";
import { Suspense } from "react";
import {
  DashboardShell,
  requireUser,
  canAccessFamilyPortal,
  getLinkedPlayerIds,
} from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatCategory } from "@/lib/players/constants";
import { redirect } from "next/navigation";
import { PlayerAvatar } from "@/components/player-avatar";
import { ClickableCard } from "@/components/clickable-card";
import { EmptyState } from "@/components/empty-state";
import { InfoBanner } from "@/components/info-banner";
import { ParentTabs } from "@/components/parent-tabs";
import { matriculeClass } from "@/lib/dashboard-ui";
import { unwrapRelation } from "@/lib/supabase/relation";

export default async function ParentHomePage() {
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  if (!(await canAccessFamilyPortal(supabase, user.id, profile.role))) {
    redirect("/dashboard");
  }

  const playerIds = await getLinkedPlayerIds(supabase, user.id);

  const { data: players } = playerIds.length
    ? await supabase
        .from("players")
        .select("id, matricule, first_name, last_name, category, team, photo_url")
        .in("id", playerIds)
        .eq("is_archived", false)
    : { data: [] };

  const { data: openDues } = playerIds.length
    ? await supabase
        .from("player_dues")
        .select("id, player_id")
        .in("player_id", playerIds)
        .in("status", ["pending", "partial", "overdue"])
    : { data: [] };

  const { data: convocationEntries } = playerIds.length
    ? await supabase
        .from("convocation_entries")
        .select("id, player_id, response, convocations ( event_date )")
        .in("player_id", playerIds)
        .eq("response", "pending")
    : { data: [] };

  const pendingConvocations =
    convocationEntries?.filter((entry) => {
      const convocation = unwrapRelation(entry.convocations);
      return convocation && new Date(convocation.event_date).getTime() >= Date.now();
    }).length ?? 0;

  const openDueCount = openDues?.length ?? 0;

  return (
    <DashboardShell
      title="Mes enfants"
      subtitle="Suivez la scolarité sportive de vos enfants — les actions se font dans chaque section du menu Parent."
      breadcrumbs={[
        { label: "Parent", href: "/dashboard/parent" },
        { label: "Mes enfants" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      <Suspense fallback={<div className="h-10" />}>
        <ParentTabs activeTab="enfants" />
      </Suspense>

      {(openDueCount > 0 || pendingConvocations > 0) && (
        <div className="flex flex-wrap gap-3">
          {openDueCount > 0 && (
            <InfoBanner title="Cotisations en attente">
              <p>
                {openDueCount} cotisation{openDueCount > 1 ? "s" : ""} à régler.
              </p>
              <Link
                href="/dashboard/parent/paiements"
                className="mt-2 inline-block text-sm font-medium text-green-800 underline"
              >
                Voir les paiements →
              </Link>
            </InfoBanner>
          )}
          {pendingConvocations > 0 && (
            <InfoBanner title="Convocations à répondre">
              <p>
                {pendingConvocations} convocation
                {pendingConvocations > 1 ? "s" : ""} en attente de réponse.
              </p>
              <Link
                href="/dashboard/parent/convocations"
                className="mt-2 inline-block text-sm font-medium text-green-800 underline"
              >
                Répondre aux convocations →
              </Link>
            </InfoBanner>
          )}
        </div>
      )}

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
            <ClickableCard key={player.id} href={`/dashboard/joueurs/${player.id}`}>
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
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
