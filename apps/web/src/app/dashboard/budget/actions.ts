"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireTreasurer, requireUser } from "@/lib/auth";
import {
  budgetNeedsSignoffs,
  expenseNeedsSignoffs,
  resolveSignoffCapabilities,
} from "@/lib/budget/permissions";
import { MIN_PAYMENT_FCFA } from "@/lib/payments/constants";

export type BudgetFormState = { error?: string; success?: string };

function text(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

function num(v: FormDataEntryValue | null) {
  return Number(v ?? 0);
}

async function getLineRemaining(
  supabase: Awaited<ReturnType<typeof createClient>>,
  lineId: string,
) {
  const { data: line } = await supabase
    .from("budget_lines")
    .select("amount_planned, line_type")
    .eq("id", lineId)
    .maybeSingle();
  if (!line || line.line_type !== "depense") return null;

  const { data: expenses } = await supabase
    .from("budget_expenses")
    .select("amount, status")
    .eq("budget_line_id", lineId)
    .in("status", ["recorded", "approved", "pending_approval"]);

  const spent =
    expenses?.reduce((sum, e) => sum + Number(e.amount), 0) ?? 0;
  return Number(line.amount_planned) - spent;
}

export async function createBudget(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const { user } = await requireTreasurer();
  const supabase = await createClient();

  const seasonId = text(formData.get("season_id"));
  const title = text(formData.get("title"));
  if (!seasonId || !title) return { error: "Saison et titre requis." };

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      season_id: seasonId,
      title,
      notes: text(formData.get("notes")) || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { error: "Impossible de créer le budget." };
  revalidatePath("/dashboard/budget");
  redirect(`/dashboard/budget/${data.id}`);
}

export async function addBudgetLine(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  await requireTreasurer();
  const supabase = await createClient();

  const budgetId = text(formData.get("budget_id"));
  const lineType = text(formData.get("line_type"));
  const category = text(formData.get("category"));
  const label = text(formData.get("label"));
  const amount = num(formData.get("amount_planned"));

  if (!budgetId || !lineType || !category || !label || amount < 0) {
    return { error: "Tous les champs sont requis." };
  }

  const { data: budget } = await supabase
    .from("budgets")
    .select("status")
    .eq("id", budgetId)
    .maybeSingle();

  if (!budget || budget.status !== "draft") {
    return { error: "Les lignes ne sont modifiables qu'en brouillon." };
  }

  const { error } = await supabase.from("budget_lines").insert({
    budget_id: budgetId,
    line_type: lineType,
    category,
    label,
    amount_planned: amount,
  });

  if (error) return { error: "Ligne impossible à ajouter." };

  const { data: lines } = await supabase
    .from("budget_lines")
    .select("line_type, amount_planned")
    .eq("budget_id", budgetId);

  let recettes = 0;
  let depenses = 0;
  for (const l of lines ?? []) {
    if (l.line_type === "recette") recettes += Number(l.amount_planned);
    else depenses += Number(l.amount_planned);
  }

  await supabase
    .from("budgets")
    .update({
      total_recettes_planned: recettes,
      total_depenses_planned: depenses,
      updated_at: new Date().toISOString(),
    })
    .eq("id", budgetId);

  revalidatePath(`/dashboard/budget/${budgetId}`);
  return { success: "Ligne ajoutée." };
}

export async function submitBudget(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const { user } = await requireTreasurer();
  const supabase = await createClient();
  const budgetId = text(formData.get("budget_id"));

  const { data: budget } = await supabase
    .from("budgets")
    .select("status, total_recettes_planned, total_depenses_planned")
    .eq("id", budgetId)
    .maybeSingle();

  if (!budget || budget.status !== "draft") {
    return { error: "Seul un brouillon peut être soumis." };
  }

  if (
    Number(budget.total_recettes_planned) <= 0 &&
    Number(budget.total_depenses_planned) <= 0
  ) {
    return { error: "Ajoutez au moins une ligne recette ou dépense." };
  }

  const { error } = await supabase
    .from("budgets")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
      submitted_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", budgetId);

  if (error) return { error: "Soumission impossible." };
  revalidatePath(`/dashboard/budget/${budgetId}`);
  return {
    success:
      "Budget soumis. Validation requise : SG + Président + TG avant septembre.",
  };
}

export async function signBudget(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const { user, profile } = await requireUser();
  const supabase = await createClient();
  const budgetId = text(formData.get("budget_id"));
  const signoffRole = text(formData.get("signoff_role"));
  const comment = text(formData.get("comment")) || null;

  const caps = await resolveSignoffCapabilities(user.id, profile.role);
  if (
    (signoffRole === "secretary_general" && !caps.canSignAsSG) ||
    (signoffRole === "president" && !caps.canSignAsPresident) ||
    (signoffRole === "treasurer" && !caps.canSignAsTG)
  ) {
    return { error: "Vous n'êtes pas autorisé à signer en tant que ce rôle." };
  }

  const { data: budget } = await supabase
    .from("budgets")
    .select("status")
    .eq("id", budgetId)
    .maybeSingle();

  if (!budget || budget.status !== "submitted") {
    return { error: "Le budget doit être soumis pour être validé." };
  }

  const { error } = await supabase.from("budget_signoffs").upsert({
    budget_id: budgetId,
    signoff_role: signoffRole,
    user_id: user.id,
    signed_at: new Date().toISOString(),
    comment,
  });

  if (error) return { error: "Signature impossible." };

  const { data: signoffs } = await supabase
    .from("budget_signoffs")
    .select("signoff_role")
    .eq("budget_id", budgetId);

  if (budgetNeedsSignoffs(signoffs ?? []).complete) {
    await supabase
      .from("budgets")
      .update({ status: "approved", updated_at: new Date().toISOString() })
      .eq("id", budgetId);
  }

  revalidatePath(`/dashboard/budget/${budgetId}`);
  return { success: "Signature enregistrée." };
}

export async function activateBudgetForm(formData: FormData) {
  await requireTreasurer();
  const supabase = await createClient();
  const budgetId = text(formData.get("budget_id"));

  const { data: budget } = await supabase
    .from("budgets")
    .select("status")
    .eq("id", budgetId)
    .maybeSingle();

  if (!budget || budget.status !== "approved") {
    return;
  }

  await supabase
    .from("budgets")
    .update({
      status: "active",
      activated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", budgetId);

  revalidatePath(`/dashboard/budget/${budgetId}`);
}

export async function addBudgetReceipt(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const { user } = await requireTreasurer();
  const supabase = await createClient();

  const budgetId = text(formData.get("budget_id"));
  const amount = num(formData.get("amount"));
  const label = text(formData.get("label"));
  const receiptType = text(formData.get("receipt_type"));

  if (!budgetId || !label || amount < MIN_PAYMENT_FCFA) {
    return { error: "Libellé et montant requis (min. 100 FCFA)." };
  }

  const { data: budget } = await supabase
    .from("budgets")
    .select("status")
    .eq("id", budgetId)
    .maybeSingle();

  if (!budget || budget.status !== "active") {
    return { error: "Les recettes ne sont saisies que sur un budget actif." };
  }

  const lineId = text(formData.get("budget_line_id")) || null;

  const { error } = await supabase.from("budget_receipts").insert({
    budget_id: budgetId,
    budget_line_id: lineId,
    receipt_type: receiptType || "autre",
    label,
    amount,
    received_at: text(formData.get("received_at")) || new Date().toISOString().slice(0, 10),
    payment_method: text(formData.get("payment_method")) || "cash",
    notes: text(formData.get("notes")) || null,
    created_by: user.id,
  });

  if (error) return { error: "Recette impossible à enregistrer." };
  revalidatePath(`/dashboard/budget/${budgetId}`);
  return { success: "Recette enregistrée (saisie manuelle)." };
}

export async function addBudgetExpense(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const { user } = await requireTreasurer();
  const supabase = await createClient();

  const budgetId = text(formData.get("budget_id"));
  const amount = num(formData.get("amount"));
  const label = text(formData.get("label"));
  const lineId = text(formData.get("budget_line_id")) || null;

  if (!budgetId || !label || amount < MIN_PAYMENT_FCFA) {
    return { error: "Libellé et montant requis." };
  }

  const { data: budget } = await supabase
    .from("budgets")
    .select("status")
    .eq("id", budgetId)
    .maybeSingle();

  if (!budget || budget.status !== "active") {
    return { error: "Les dépenses ne sont saisies que sur un budget actif." };
  }

  let isOverBudget = false;
  let overAmount = 0;
  let status = "recorded";

  if (lineId) {
    const remaining = await getLineRemaining(supabase, lineId);
    if (remaining !== null && amount > remaining) {
      isOverBudget = true;
      overAmount = amount - remaining;
      status = "pending_approval";
    }
  } else {
    isOverBudget = true;
    overAmount = amount;
    status = "pending_approval";
  }

  const { error } = await supabase.from("budget_expenses").insert({
    budget_id: budgetId,
    budget_line_id: lineId,
    label,
    amount,
    expense_date: text(formData.get("expense_date")) || new Date().toISOString().slice(0, 10),
    payment_method: text(formData.get("payment_method")) || "cash",
    status,
    is_over_budget: isOverBudget,
    over_budget_amount: overAmount,
    notes: text(formData.get("notes")) || null,
    created_by: user.id,
  });

  if (error) return { error: "Dépense impossible à enregistrer." };

  revalidatePath(`/dashboard/budget/${budgetId}`);
  if (isOverBudget) {
    return {
      success:
        "Dépense hors budget enregistrée — approbation SG + Président requise.",
    };
  }
  return { success: "Dépense enregistrée dans le budget." };
}

export async function signOverBudgetExpense(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  const { user, profile } = await requireUser();
  const supabase = await createClient();

  const expenseId = text(formData.get("expense_id"));
  const signoffRole = text(formData.get("signoff_role"));
  const decision = text(formData.get("decision")) as "approved" | "rejected";
  const comment = text(formData.get("comment")) || null;

  const meta = await resolveSignoffCapabilities(user.id, profile.role);
  if (
    (signoffRole === "secretary_general" && !meta.canSignAsSG) ||
    (signoffRole === "president" && !meta.canSignAsPresident)
  ) {
    return { error: "Non autorisé." };
  }

  const { data: expense } = await supabase
    .from("budget_expenses")
    .select("id, budget_id, status")
    .eq("id", expenseId)
    .maybeSingle();

  if (!expense || expense.status !== "pending_approval") {
    return { error: "Dépense introuvable ou déjà traitée." };
  }

  await supabase.from("budget_expense_signoffs").upsert({
    expense_id: expenseId,
    signoff_role: signoffRole,
    user_id: user.id,
    decision,
    signed_at: new Date().toISOString(),
    comment,
  });

  const { data: signoffs } = await supabase
    .from("budget_expense_signoffs")
    .select("signoff_role, decision")
    .eq("expense_id", expenseId);

  const state = expenseNeedsSignoffs(signoffs ?? []);
  let newStatus = "pending_approval";
  if (state.rejected) newStatus = "rejected";
  else if (state.complete) newStatus = "approved";

  await supabase
    .from("budget_expenses")
    .update({ status: newStatus })
    .eq("id", expenseId);

  revalidatePath(`/dashboard/budget/${expense.budget_id}`);
  return { success: `Décision enregistrée (${decision}).` };
}

async function recalculateBudgetTotals(
  supabase: Awaited<ReturnType<typeof createClient>>,
  budgetId: string,
) {
  const { data: lines } = await supabase
    .from("budget_lines")
    .select("line_type, amount_planned")
    .eq("budget_id", budgetId);

  let recettes = 0;
  let depenses = 0;
  for (const l of lines ?? []) {
    if (l.line_type === "recette") recettes += Number(l.amount_planned);
    else depenses += Number(l.amount_planned);
  }

  await supabase
    .from("budgets")
    .update({
      total_recettes_planned: recettes,
      total_depenses_planned: depenses,
      updated_at: new Date().toISOString(),
    })
    .eq("id", budgetId);
}

export async function updateBudgetLine(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  await requireTreasurer();
  const supabase = await createClient();

  const lineId = text(formData.get("line_id"));
  const label = text(formData.get("label"));
  const amount = num(formData.get("amount_planned"));

  if (!lineId || !label || amount < 0) {
    return { error: "Libellé et montant requis." };
  }

  const { data: line } = await supabase
    .from("budget_lines")
    .select("budget_id, budgets(status)")
    .eq("id", lineId)
    .maybeSingle();

  const budget = line?.budgets as { status: string } | { status: string }[] | null;
  const budgetStatus = Array.isArray(budget) ? budget[0]?.status : budget?.status;

  if (!line || budgetStatus !== "draft") {
    return { error: "Ligne modifiable uniquement en brouillon." };
  }

  const { error } = await supabase
    .from("budget_lines")
    .update({ label, amount_planned: amount })
    .eq("id", lineId);

  if (error) return { error: "Modification impossible." };

  await recalculateBudgetTotals(supabase, line.budget_id);
  revalidatePath(`/dashboard/budget/${line.budget_id}`);
  return { success: "Ligne mise à jour." };
}

export async function deleteBudgetLine(
  _prev: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  await requireTreasurer();
  const supabase = await createClient();

  const lineId = text(formData.get("line_id"));
  if (!lineId) return { error: "Ligne introuvable." };

  const { data: line } = await supabase
    .from("budget_lines")
    .select("budget_id, budgets(status)")
    .eq("id", lineId)
    .maybeSingle();

  const budget = line?.budgets as { status: string } | { status: string }[] | null;
  const budgetStatus = Array.isArray(budget) ? budget[0]?.status : budget?.status;

  if (!line || budgetStatus !== "draft") {
    return { error: "Ligne supprimable uniquement en brouillon." };
  }

  const { error } = await supabase.from("budget_lines").delete().eq("id", lineId);

  if (error) return { error: "Suppression impossible." };

  await recalculateBudgetTotals(supabase, line.budget_id);
  revalidatePath(`/dashboard/budget/${line.budget_id}`);
  return { success: "Ligne supprimée." };
}

export async function signOverBudgetExpenseForm(formData: FormData) {
  await signOverBudgetExpense({}, formData);
}
