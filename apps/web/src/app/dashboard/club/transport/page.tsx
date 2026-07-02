import Link from "next/link";
import { Suspense } from "react";
import { navActionClass, primaryActionClass } from "@/lib/dashboard-ui";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClubSection } from "@/components/club-ui";
import { ClubModuleTabs } from "@/components/club-module-tabs";
import { resolveClubTab } from "@/lib/resolve-club-tab";
import { InfoBanner } from "@/components/info-banner";
import { TransportForm, TransportList } from "./transport-client";

const TABS = ["liste", "creer"] as const;

export default async function TransportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = resolveClubTab(params.tab, [...TABS], "liste");

  const { profile } = await requireStaff();
  const supabase = await createClient();

  const { data: players } = await supabase
    .from("players")
    .select("id, first_name, last_name, matricule")
    .eq("is_archived", false)
    .order("last_name");

  const { data: requests } = await supabase
    .from("transport_requests")
    .select("*, players(first_name, last_name)")
    .order("created_at", { ascending: false });

  const pendingCount =
    requests?.filter((r) => r.status === "pending").length ?? 0;

  return (
    <DashboardShell
      title="Transport"
      breadcrumbs={[
        { label: "Club", href: "/dashboard" },
        { label: "Vie du club", href: "/dashboard/club" },
        { label: "Transport" },
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={
        activeTab === "liste" ? (
          <Link
            href="/dashboard/club/transport?tab=creer"
            className={primaryActionClass}
          >
            Nouvelle demande
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
          ariaLabel="Transport"
          defaultTab="liste"
          activeTab={activeTab}
          tabs={[
            { id: "liste", label: "Demandes", count: pendingCount },
            { id: "creer", label: "Créer" },
          ]}
        />
      </Suspense>

      {activeTab === "creer" ? (
        <div className="max-w-2xl space-y-4">
          <InfoBanner title="Demande de transport">
            <p>
              Planifiez un déplacement pour un match, un entraînement ou un
              événement du club.
            </p>
          </InfoBanner>
          <TransportForm
            players={
              players?.map((p) => ({
                id: p.id,
                label: `${p.last_name} ${p.first_name} (${p.matricule})`,
              })) ?? []
            }
          />
        </div>
      ) : (
        <ClubSection title="Demandes">
          <TransportList requests={requests ?? []} />
        </ClubSection>
      )}
    </DashboardShell>
  );
}
