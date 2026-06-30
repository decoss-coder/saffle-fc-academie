import { redirect, notFound } from "next/navigation";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PlayerForm } from "@/components/player-form";
import { PlayerPhotoSection } from "@/components/player-photo-section";
import { updatePlayer } from "@/app/dashboard/joueurs/actions";

export default async function ModifierJoueurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, profile } = await requireStaff();

  if (!profile) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: player } = await supabase
    .from("players")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!player || player.is_archived) {
    notFound();
  }

  const playerName = `${player.last_name} ${player.first_name}`;

  return (
    <DashboardShell
      title={`Modifier — ${playerName}`}
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Joueurs", href: "/dashboard/joueurs" },
        { label: playerName, href: `/dashboard/joueurs/${player.id}` },
        { label: "Modifier" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      <div className="space-y-6">
        <PlayerPhotoSection
          playerId={player.id}
          firstName={player.first_name}
          lastName={player.last_name}
          photoPath={player.photo_url}
        />
        <PlayerForm
        action={updatePlayer}
        player={player}
        cancelHref={`/dashboard/joueurs/${player.id}`}
        />
      </div>
    </DashboardShell>
  );
}
