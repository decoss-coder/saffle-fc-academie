import Link from "next/link";
import { DashboardShell, requireTreasurer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
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
      subtitle={`2 500 / 5 000 FCFA — ${CLUB.name}`}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={<Link href="/dashboard/club" className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800">Retour</Link>}
    >
      <MatchForm />
      <ClubSection title="Historique">
        <MatchList matches={matches ?? []} />
      </ClubSection>
    </DashboardShell>
  );
}
