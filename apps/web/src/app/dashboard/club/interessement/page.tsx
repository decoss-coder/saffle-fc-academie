import Link from "next/link";
import { DashboardShell, requireTreasurer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
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
      subtitle={CLUB.name}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={<Link href="/dashboard/club" className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800">Retour</Link>}
    >
      <ProfitSharingForm />
      <ClubSection title="Pools">
        <PoolList pools={pools ?? []} />
      </ClubSection>
    </DashboardShell>
  );
}
