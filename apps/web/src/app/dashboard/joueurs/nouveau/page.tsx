import { redirect } from "next/navigation";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { PlayerForm } from "@/components/player-form";
import { createPlayer } from "@/app/dashboard/joueurs/actions";

export default async function NouveauJoueurPage() {
  const { user, profile } = await requireStaff();

  if (!profile) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell
      title="Nouveau joueur"
      subtitle="Inscription d'un joueur au SAFFLE FC Académie"
      userName={profile.full_name || user.email || "Utilisateur"}
      userRole={profile.role}
    >
      <PlayerForm action={createPlayer} />
    </DashboardShell>
  );
}
