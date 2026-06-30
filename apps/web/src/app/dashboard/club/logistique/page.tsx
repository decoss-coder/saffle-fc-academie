import Link from "next/link";
import { navActionClass } from "@/lib/dashboard-ui";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Vie du club", href: "/dashboard/club" },
        { label: "Logistique" },
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={<Link href="/dashboard/club" className={navActionClass}>Retour</Link>}
    >
      <LogisticsForm />
      <ClubSection title="Tâches">
        <LogisticsList tasks={tasks ?? []} />
      </ClubSection>
    </DashboardShell>
  );
}
