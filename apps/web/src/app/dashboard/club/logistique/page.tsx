import Link from "next/link";
import { Suspense } from "react";
import { navActionClass, primaryActionClass } from "@/lib/dashboard-ui";
import { DashboardShell, requireStaff } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ClubSection } from "@/components/club-ui";
import { ClubModuleTabs } from "@/components/club-module-tabs";
import { resolveClubTab } from "@/lib/resolve-club-tab";
import { InfoBanner } from "@/components/info-banner";
import { LogisticsForm, LogisticsList } from "./logistique-client";

const TABS = ["liste", "creer"] as const;

export default async function LogistiquePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const activeTab = resolveClubTab(params.tab, [...TABS], "liste");

  const { profile } = await requireStaff();
  const supabase = await createClient();

  const { data: tasks } = await supabase
    .from("logistics_tasks")
    .select("*")
    .order("created_at", { ascending: false });

  const openCount =
    tasks?.filter((t) => t.status !== "done").length ?? 0;

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
      actions={
        activeTab === "liste" ? (
          <Link
            href="/dashboard/club/logistique?tab=creer"
            className={primaryActionClass}
          >
            Nouvelle tâche
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
          ariaLabel="Logistique"
          defaultTab="liste"
          activeTab={activeTab}
          tabs={[
            { id: "liste", label: "Tâches", count: openCount },
            { id: "creer", label: "Créer" },
          ]}
        />
      </Suspense>

      {activeTab === "creer" ? (
        <div className="max-w-2xl space-y-4">
          <InfoBanner title="Nouvelle tâche logistique">
            <p>
              Planifiez l&apos;entretien du terrain, de la tondeuse, de la salle
              de gym ou toute autre tâche du club.
            </p>
          </InfoBanner>
          <LogisticsForm />
        </div>
      ) : (
        <ClubSection title="Tâches">
          <LogisticsList tasks={tasks ?? []} />
        </ClubSection>
      )}
    </DashboardShell>
  );
}
