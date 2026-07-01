import Link from "next/link";
import { Suspense } from "react";
import { DashboardShell, requireUser } from "@/lib/auth";
import { canViewBudget } from "@/lib/budget/permissions";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BUDGET_STATUS_LABELS } from "@/lib/budget/constants";
import { formatFcfa } from "@/lib/payments/constants";
import { CreateBudgetForm } from "./create-budget-form";
import { BudgetTabs } from "./budget-tabs";
import { ClubSection } from "@/components/club-ui";
import { EmptyState } from "@/components/empty-state";
import { ClickableCard } from "@/components/clickable-card";
import { InfoBanner } from "@/components/info-banner";
import { navActionClass, primaryActionClass } from "@/lib/dashboard-ui";
import { resolveClubTab } from "@/components/club-module-tabs";

const TABS = ["liste", "creer"] as const;

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const { profile } = await requireUser();
  if (!canViewBudget(profile.role)) redirect("/dashboard");

  const isTreasurer = ["admin", "president", "treasurer"].includes(profile.role);
  const activeTab = (
    params.tab === "creer" && isTreasurer
      ? "creer"
      : resolveClubTab(params.tab, [...TABS], "liste")
  ) as (typeof TABS)[number];

  const supabase = await createClient();

  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, is_active, start_date, end_date")
    .order("start_date", { ascending: false });

  const { data: budgets } = await supabase
    .from("budgets")
    .select("*, seasons(name, start_date)")
    .order("created_at", { ascending: false });

  return (
    <DashboardShell
      title="Budget prévisionnel"
      breadcrumbs={[
        { label: "Finance", href: "/dashboard" },
        { label: "Budget" },
      ]}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={
        activeTab === "liste" && isTreasurer ? (
          <Link
            href="/dashboard/budget?tab=creer"
            className={primaryActionClass}
          >
            Nouveau budget
          </Link>
        ) : (
          <Link href="/dashboard/comite" className={navActionClass}>
            ← Comité directeur
          </Link>
        )
      }
    >
      <InfoBanner>
        Le montant total du budget est <strong>voté et arrêté manuellement</strong>{" "}
        avant le début de saison. Les recettes (cotisations élèves, cotisations
        comité, subventions…) et les dépenses sont saisies séparément — sans
        alimentation automatique depuis Wave.
      </InfoBanner>

      <Suspense fallback={<div className="h-10" />}>
        <BudgetTabs
          activeTab={activeTab}
          budgetsCount={budgets?.length ?? 0}
          canCreate={isTreasurer}
        />
      </Suspense>

      {activeTab === "creer" && isTreasurer ? (
        <div className="max-w-2xl">
          <CreateBudgetForm seasons={seasons ?? []} />
        </div>
      ) : (
        <ClubSection title="Budgets">
          <div className="space-y-3">
            {(budgets ?? []).map((b) => (
              <ClickableCard key={b.id} href={`/dashboard/budget/${b.id}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-green-900">{b.title}</p>
                    <p className="text-sm text-slate-600">
                      {(b.seasons as { name?: string } | null)?.name ?? "Saison"}{" "}
                      · {BUDGET_STATUS_LABELS[b.status] ?? b.status}
                    </p>
                  </div>
                  <div className="text-right text-sm text-green-800">
                    <p>
                      Recettes prévues :{" "}
                      {formatFcfa(Number(b.total_recettes_planned))}
                    </p>
                    <p>
                      Dépenses prévues :{" "}
                      {formatFcfa(Number(b.total_depenses_planned))}
                    </p>
                  </div>
                </div>
              </ClickableCard>
            ))}
            {!budgets?.length && (
              <EmptyState message="Aucun budget créé.">
                {isTreasurer && (
                  <Link
                    href="/dashboard/budget?tab=creer"
                    className={primaryActionClass}
                  >
                    Créer un budget
                  </Link>
                )}
              </EmptyState>
            )}
          </div>
        </ClubSection>
      )}
    </DashboardShell>
  );
}
