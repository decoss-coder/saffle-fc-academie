import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardShell, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CLUB } from "@/lib/club";
import { canViewBudget, resolveSignoffCapabilities } from "@/lib/budget/permissions";
import { formatFcfa } from "@/lib/payments/constants";
import { ClubSection } from "@/components/club-ui";
import {
  ActivateBudgetButton,
  BudgetLineForm,
  BudgetStatusBadge,
  ExpenseForm,
  OverBudgetPanel,
  ReceiptForm,
  SignBudgetPanel,
  SubmitBudgetForm,
} from "../budget-detail-client";

export default async function BudgetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile, user } = await requireUser();
  if (!canViewBudget(profile.role)) redirect("/dashboard");

  const supabase = await createClient();
  const caps = await resolveSignoffCapabilities(user.id, profile.role);
  const isTreasurer = ["admin", "president", "treasurer"].includes(profile.role);

  const { data: budget } = await supabase
    .from("budgets")
    .select("*, seasons(name, start_date)")
    .eq("id", id)
    .maybeSingle();

  if (!budget) redirect("/dashboard/budget");

  const { data: lines } = await supabase
    .from("budget_lines")
    .select("*")
    .eq("budget_id", id)
    .order("line_type")
    .order("sort_order");

  const { data: signoffs } = await supabase
    .from("budget_signoffs")
    .select("signoff_role, signed_at")
    .eq("budget_id", id);

  const { data: receipts } = await supabase
    .from("budget_receipts")
    .select("*")
    .eq("budget_id", id)
    .order("received_at", { ascending: false });

  const { data: expenses } = await supabase
    .from("budget_expenses")
    .select("*")
    .eq("budget_id", id)
    .order("expense_date", { ascending: false });

  const expenseIds = (expenses ?? []).map((e) => e.id);
  const { data: expenseSignoffs } = expenseIds.length
    ? await supabase
        .from("budget_expense_signoffs")
        .select("expense_id, signoff_role, decision")
        .in("expense_id", expenseIds)
    : { data: [] };

  const recetteLines = (lines ?? []).filter((l) => l.line_type === "recette");
  const depenseLines = (lines ?? []).filter((l) => l.line_type === "depense");

  const totalRecettes = (receipts ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const totalDepenses = (expenses ?? [])
    .filter((e) => e.status !== "rejected")
    .reduce((s, e) => s + Number(e.amount), 0);

  const expensesWithSignoffs = (expenses ?? []).map((e) => ({
    ...e,
    signoffs: (expenseSignoffs ?? []).filter((s) => s.expense_id === e.id),
  }));

  const isDraft = budget.status === "draft";
  const isActive = budget.status === "active";

  return (
    <DashboardShell
      title={budget.title}
      subtitle={`${(budget.seasons as { name?: string } | null)?.name ?? "Saison"} — ${CLUB.name}`}
      userName={profile.full_name ?? "Utilisateur"}
      userRole={profile.role}
      actions={
        <Link href="/dashboard/budget" className="rounded-full border border-green-300 px-5 py-2 text-sm text-green-800">
          Retour
        </Link>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <BudgetStatusBadge status={budget.status} />
        {isTreasurer && budget.status === "approved" && (
          <ActivateBudgetButton budgetId={id} status={budget.status} />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-green-200 bg-white p-4 text-sm">
          <p className="text-green-600">Recettes prévues</p>
          <p className="text-xl font-semibold text-green-900">
            {formatFcfa(Number(budget.total_recettes_planned))}
          </p>
          {isActive && (
            <p className="mt-1 text-green-700">Encaissé : {formatFcfa(totalRecettes)}</p>
          )}
        </div>
        <div className="rounded-2xl border border-green-200 bg-white p-4 text-sm">
          <p className="text-green-600">Dépenses prévues</p>
          <p className="text-xl font-semibold text-green-900">
            {formatFcfa(Number(budget.total_depenses_planned))}
          </p>
          {isActive && (
            <p className="mt-1 text-green-700">Dépensé : {formatFcfa(totalDepenses)}</p>
          )}
        </div>
        <div className="rounded-2xl border border-green-200 bg-white p-4 text-sm">
          <p className="text-green-600">Solde prévisionnel</p>
          <p className="text-xl font-semibold text-green-900">
            {formatFcfa(
              Number(budget.total_recettes_planned) - Number(budget.total_depenses_planned),
            )}
          </p>
          {isActive && (
            <p className="mt-1 text-green-700">
              Réel : {formatFcfa(totalRecettes - totalDepenses)}
            </p>
          )}
        </div>
      </div>

      {isTreasurer && isDraft && <BudgetLineForm budgetId={id} disabled={false} />}

      {isTreasurer && isDraft && (
        <SubmitBudgetForm budgetId={id} canSubmit={!!lines?.length} />
      )}

      <SignBudgetPanel
        budgetId={id}
        signoffs={signoffs ?? []}
        caps={caps}
        status={budget.status}
      />

      <OverBudgetPanel
        expenses={expensesWithSignoffs}
        caps={{ canSignAsSG: caps.canSignAsSG, canSignAsPresident: caps.canSignAsPresident }}
      />

      <ClubSection title="Lignes prévisionnelles">
        <div className="overflow-x-auto rounded-2xl border border-green-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-green-800 text-green-100">
              <tr>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Catégorie</th>
                <th className="px-4 py-3 text-left">Libellé</th>
                <th className="px-4 py-3 text-right">Prévu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-100">
              {(lines ?? []).map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 capitalize">{l.line_type}</td>
                  <td className="px-4 py-3">{l.category}</td>
                  <td className="px-4 py-3">{l.label}</td>
                  <td className="px-4 py-3 text-right">{formatFcfa(Number(l.amount_planned))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ClubSection>

      {isActive && isTreasurer && (
        <>
          <ReceiptForm budgetId={id} recetteLines={recetteLines} />
          <ExpenseForm budgetId={id} depenseLines={depenseLines} />
        </>
      )}

      {isActive && (
        <>
          <ClubSection title="Recettes enregistrées">
            <div className="space-y-2">
              {(receipts ?? []).map((r) => (
                <article key={r.id} className="rounded-xl border border-green-200 bg-white p-3 text-sm">
                  <p className="font-medium text-green-900">{r.label}</p>
                  <p className="text-green-700">
                    {formatFcfa(Number(r.amount))} · {r.receipt_type} · {r.received_at}
                  </p>
                </article>
              ))}
            </div>
          </ClubSection>
          <ClubSection title="Dépenses enregistrées">
            <div className="space-y-2">
              {(expenses ?? []).map((e) => (
                <article key={e.id} className="rounded-xl border border-green-200 bg-white p-3 text-sm">
                  <p className="font-medium text-green-900">{e.label}</p>
                  <p className="text-green-700">
                    {formatFcfa(Number(e.amount))} · {e.status}
                    {e.is_over_budget ? " · hors budget" : ""}
                  </p>
                </article>
              ))}
            </div>
          </ClubSection>
        </>
      )}
    </DashboardShell>
  );
}
