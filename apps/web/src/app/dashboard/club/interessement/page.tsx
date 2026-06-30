import Link from "next/link";
import { navActionClass } from "@/lib/dashboard-ui";
import { DashboardShell, requireTreasurer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClubSection } from "@/components/club-ui";
import { PoolList, ProfitSharingForm } from "./interessement-client";

export default async function InteressementPage() {
  const { profile } = await requireTreasurer();
  const supabase = await createClient();

  const { data: pools } = await supabase
    .from("profit_sharing_pools")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <DashboardShell
      title="Intéressement"
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Vie du club", href: "/dashboard/club" },
        { label: "Intéressement" },
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={<Link href="/dashboard/club" className={navActionClass}>Retour</Link>}
    >
      <ProfitSharingForm />
      <ClubSection title="Pools">
        <PoolList pools={pools ?? []} />
      </ClubSection>
    </DashboardShell>
  );
}
