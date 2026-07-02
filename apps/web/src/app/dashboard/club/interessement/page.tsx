import Link from "next/link";
import { Suspense } from "react";
import { navActionClass, primaryActionClass } from "@/lib/dashboard-ui";
import { DashboardShell, requireTreasurer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClubSection } from "@/components/club-ui";
import { ClubModuleTabs } from "@/components/club-module-tabs";
import { resolveClubTab } from "@/lib/resolve-club-tab";
import { InfoBanner } from "@/components/info-banner";
import { PoolList, ProfitSharingForm } from "./interessement-client";

const TABS = ["liste", "creer"] as const;

export default async function InteressementPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = resolveClubTab(params.tab, [...TABS], "liste");

  const { profile } = await requireTreasurer();
  const supabase = await createClient();

  const { data: pools } = await supabase
    .from("profit_sharing_pools")
    .select("*")
    .order("created_at", { ascending: false });

  const activeCount =
    pools?.filter((p) => p.status !== "closed").length ?? 0;

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
      actions={
        activeTab === "liste" ? (
          <Link
            href="/dashboard/club/interessement?tab=creer"
            className={primaryActionClass}
          >
            Nouveau pool
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
          ariaLabel="Intéressement"
          defaultTab="liste"
          activeTab={activeTab}
          tabs={[
            { id: "liste", label: "Pools", count: activeCount },
            { id: "creer", label: "Créer" },
          ]}
        />
      </Suspense>

      {activeTab === "creer" ? (
        <div className="max-w-2xl space-y-4">
          <InfoBanner title="Pool d'intéressement">
            <p>
              Créez un pool de répartition des gains par groupe ou événement du
              club.
            </p>
          </InfoBanner>
          <ProfitSharingForm />
        </div>
      ) : (
        <ClubSection title="Pools">
          <PoolList pools={pools ?? []} />
        </ClubSection>
      )}
    </DashboardShell>
  );
}
