import Link from "next/link";
import { Suspense } from "react";
import { navActionClass, primaryActionClass } from "@/lib/dashboard-ui";
import { DashboardShell, requireTreasurer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClubSection } from "@/components/club-ui";
import { ClubModuleTabs } from "@/components/club-module-tabs";
import { resolveClubTab } from "@/lib/resolve-club-tab";
import { InfoBanner } from "@/components/info-banner";
import { MatchForm, MatchList } from "./matchs-client";

const TABS = ["liste", "creer"] as const;

export default async function MatchsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = resolveClubTab(params.tab, [...TABS], "liste");

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
      actions={
        activeTab === "liste" ? (
          <Link
            href="/dashboard/club/matchs?tab=creer"
            className={primaryActionClass}
          >
            Nouveau match
          </Link>
        ) : (
          <Link href="/dashboard/club" className={navActionClass}>
            Retour
          </Link>
        )
      }
    >
      <Suspense fallback={<div className="h-10" />}>
        <ClubModuleTabs
          ariaLabel="Matchs"
          defaultTab="liste"
          activeTab={activeTab}
          tabs={[
            { id: "liste", label: "Historique", count: matches?.length ?? 0 },
            { id: "creer", label: "Créer" },
          ]}
        />
      </Suspense>

      {activeTab === "creer" ? (
        <div className="max-w-2xl space-y-4">
          <InfoBanner title="Match & primes">
            <p>
              Enregistrez un match officiel ou amical et les primes associées
              (2 500 / 5 000 FCFA).
            </p>
          </InfoBanner>
          <MatchForm />
        </div>
      ) : (
        <ClubSection title="Historique">
          <MatchList matches={matches ?? []} />
        </ClubSection>
      )}
    </DashboardShell>
  );
}
