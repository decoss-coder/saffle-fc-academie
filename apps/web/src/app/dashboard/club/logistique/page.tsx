import Link from "next/link";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import { ClubSection } from "@/components/club-ui";
import { LogisticsForm, LogisticsList } from "./logistique-client";

export default async function LogistiquePage() {
  const { profile } = await requireStaff();
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("logistics_tasks")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <DashboardShell
      title="Logistique"
      subtitle={CLUB.name}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={<Link href="/dashboard/club" className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800">Retour</Link>}
    >
      <LogisticsForm />
      <ClubSection title="Tâches">
        <LogisticsList tasks={tasks ?? []} />
      </ClubSection>
    </DashboardShell>
  );
}
