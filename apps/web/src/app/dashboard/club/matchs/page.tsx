import Link from "next/link";
import { navActionClass } from "@/lib/dashboard-ui";
import { DashboardShell, requireTreasurer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClubSection } from "@/components/club-ui";
import { MatchForm, MatchList } from "./matchs-client";

export default async function MatchsPage() {
  const { profile } = await requireTreasurer();
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("club_matches")
    .select("*")
    .order("match_date", { ascending: false })
    .limit(20);

  return (
    <DashboardShell
      title="Matchs & primes"
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Vie du club", href: "/dashboard/club" },
        { label: "Matchs & primes" },
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={<Link href="/dashboard/club" className={navActionClass}>Retour</Link>}
    >
      <MatchForm />
      <ClubSection title="Historique">
        <MatchList matches={matches ?? []} />
      </ClubSection>
    </DashboardShell>
  );
}
