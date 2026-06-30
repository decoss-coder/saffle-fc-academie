import Link from "next/link";
import { DashboardShell, requireUser } from "@/lib/auth";
import { canViewBudget } from "@/lib/budget/permissions";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import { BUDGET_STATUS_LABELS } from "@/lib/budget/constants";
import { formatFcfa } from "@/lib/payments/constants";
import { CreateBudgetForm } from "./create-budget-form";
import { ClubSection } from "@/components/club-ui";

export default async function BudgetPage() {
  const { profile } = await requireUser();
  if (!canViewBudget(profile.role)) redirect("/dashboard");

  const supabase = await createClient();
  const isTreasurer = ["admin", "president", "treasurer"].includes(profile.role);

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
      subtitle={`Vote avant septembre — ${CLUB.name}`}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={
        <Link href="/dashboard/comite" className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800">
          Comité directeur
        </Link>
      }
    >
      <p className="rounded-xl border border-green-200 bg-white px-4 py-3 text-sm text-green-800">
        Le montant total du budget est <strong>voté et arrêté manuellement</strong> avant le début de saison.
        Les recettes (cotisations élèves, cotisations comité, subventions…) et les dépenses sont saisies
        séparément — sans alimentation automatique depuis Wave.
      </p>

      {isTreasurer && <CreateBudgetForm seasons={seasons ?? []} />}

      <ClubSection title="Budgets">
        <div className="space-y-3">
          {(budgets ?? []).map((b) => (
            <Link
              key={b.id}
              href={`/dashboard/budget/${b.id}`}
              className="block rounded-2xl border border-green-200 bg-white p-5 shadow-sm transition hover:border-green-400"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-green-900">{b.title}</p>
                  <p className="text-sm text-green-700">
                    {(b.seasons as { name?: string } | null)?.name ?? "Saison"} ·{" "}
                    {BUDGET_STATUS_LABELS[b.status] ?? b.status}
                  </p>
                </div>
                <div className="text-right text-sm text-green-800">
                  <p>Recettes prévues : {formatFcfa(Number(b.total_recettes_planned))}</p>
                  <p>Dépenses prévues : {formatFcfa(Number(b.total_depenses_planned))}</p>
                </div>
              </div>
            </Link>
          ))}
          {!budgets?.length && (
            <p className="text-sm text-green-700">Aucun budget créé.</p>
          )}
        </div>
      </ClubSection>
    </DashboardShell>
  );
}
