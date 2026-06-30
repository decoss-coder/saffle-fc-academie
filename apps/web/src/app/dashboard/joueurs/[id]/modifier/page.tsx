import { redirect, notFound } from "next/navigation";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PlayerForm } from "@/components/player-form";
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

  return (
    <DashboardShell
      title={`Modifier — ${player.last_name} ${player.first_name}`}
      subtitle={player.matricule}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      <PlayerForm
        action={updatePlayer}
        player={player}
        cancelHref={`/dashboard/joueurs/${player.id}`}
      />
    </DashboardShell>
  );
}
