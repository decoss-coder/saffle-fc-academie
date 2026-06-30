import { redirect } from "next/navigation";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { PlayerForm } from "@/components/player-form";
import { createPlayer } from "@/app/dashboard/joueurs/actions";
import { PLAYER_GROUPS } from "@/lib/players/constants";

export default async function NouveauJoueurPage({
  searchParams,
}: {
  searchParams: Promise<{ groupe?: string }>;
}) {
  const { groupe } = await searchParams;
  const defaultTeamGroup = PLAYER_GROUPS.find((g) => g.team === groupe)?.team;

  const { user, profile } = await requireStaff();

  if (!profile) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell
      title="Nouveau joueur"
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Joueurs", href: "/dashboard/joueurs" },
        { label: "Nouveau joueur" },
      ]}
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      <PlayerForm action={createPlayer} defaultTeamGroup={defaultTeamGroup} />
    </DashboardShell>
  );
}
