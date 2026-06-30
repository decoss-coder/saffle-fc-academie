"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTreasurer } from "@/lib/auth";
import { MIN_PAYMENT_FCFA } from "@/lib/payments/constants";
import { COMMITTEE_ROLES } from "@/lib/budget/constants";

export type ComiteFormState = { error?: string; success?: string };

function text(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

function num(v: FormDataEntryValue | null) {
  return Number(v ?? 0);
}

export async function createCommitteeDue(
  _prev: ComiteFormState,
  formData: FormData,
): Promise<ComiteFormState> {
  const { user } = await requireTreasurer();
  const supabase = await createClient();

  const memberPhone = text(formData.get("member_phone"));
  const label = text(formData.get("label"));
  const amount = num(formData.get("amount_due"));

  if (!memberPhone || !label || amount < MIN_PAYMENT_FCFA) {
    return { error: "Membre, libellé et montant requis." };
  }

  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();

  const { error } = await supabase.from("committee_dues").insert({
    member_phone: memberPhone,
    season_id: season?.id ?? null,
    label,
    amount_due: amount,
    due_date: text(formData.get("due_date")) || null,
    created_by: user.id,
  });

  if (error) return { error: "Cotisation impossible à créer." };
  revalidatePath("/dashboard/comite");
  return { success: "Cotisation comité directeur créée." };
}

export async function createBulkCommitteeDue(
  _prev: ComiteFormState,
  formData: FormData,
): Promise<ComiteFormState> {
  const { user } = await requireTreasurer();
  const supabase = await createClient();

  const label = text(formData.get("label"));
  const amount = num(formData.get("amount_due"));
  if (!label || amount < MIN_PAYMENT_FCFA) {
    return { error: "Libellé et montant requis." };
  }

  const { data: members } = await supabase
    .from("phone_registry")
    .select("phone_normalized")
    .in("role", [...COMMITTEE_ROLES]);

  if (!members?.length) {
    return { error: "Aucun membre du comité directeur trouvé." };
  }

  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();

  const rows = members.map((m) => ({
    member_phone: m.phone_normalized,
    season_id: season?.id ?? null,
    label,
    amount_due: amount,
    due_date: text(formData.get("due_date")) || null,
    created_by: user.id,
  }));

  const { error } = await supabase.from("committee_dues").insert(rows);
  if (error) return { error: "Création groupée impossible." };

  revalidatePath("/dashboard/comite");
  return {
    success: `${members.length} cotisation(s) créée(s) pour le comité directeur.`,
  };
}

export async function recordCommitteePayment(
  _prev: ComiteFormState,
  formData: FormData,
): Promise<ComiteFormState> {
  const { user } = await requireTreasurer();
  const supabase = await createClient();

  const dueId = text(formData.get("committee_due_id"));
  const amount = num(formData.get("amount"));
  const linkBudget = formData.get("link_budget") === "on";

  if (!dueId || amount < MIN_PAYMENT_FCFA) {
    return { error: "Montant invalide." };
  }

  const { data: due } = await supabase
    .from("committee_dues")
    .select("*, phone_registry(full_name, position_title)")
    .eq("id", dueId)
    .maybeSingle();

  if (!due) return { error: "Cotisation introuvable." };

  const newPaid = Number(due.amount_paid) + amount;
  const newStatus =
    newPaid >= Number(due.amount_due)
      ? "paid"
      : newPaid > 0
        ? "partial"
        : "pending";

  const { data: payment, error: payErr } = await supabase
    .from("committee_due_payments")
    .insert({
      committee_due_id: dueId,
      amount,
      payment_method: text(formData.get("payment_method")) || "cash",
      notes: text(formData.get("notes")) || null,
      recorded_by: user.id,
    })
    .select("id")
    .single();

  if (payErr) return { error: "Paiement impossible." };

  await supabase
    .from("committee_dues")
    .update({
      amount_paid: newPaid,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dueId);

  if (linkBudget) {
    const { data: activeBudget } = await supabase
      .from("budgets")
      .select("id")
      .eq("status", "active")
      .maybeSingle();

    if (activeBudget) {
      const member = due.phone_registry as { full_name?: string; position_title?: string } | null;
      const memberLabel = member?.full_name ?? "Membre comité";

      const { data: receipt } = await supabase
        .from("budget_receipts")
        .insert({
          budget_id: activeBudget.id,
          receipt_type: "cotisation_comite",
          label: `Cotisation comité — ${memberLabel} — ${due.label}`,
          amount,
          payment_method: text(formData.get("payment_method")) || "cash",
          notes: "Lié au paiement comité directeur",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (receipt) {
        await supabase
          .from("committee_due_payments")
          .update({ budget_receipt_id: receipt.id })
          .eq("id", payment.id);
      }
    }
  }

  revalidatePath("/dashboard/comite");
  revalidatePath("/dashboard/budget");
  return { success: "Paiement comité enregistré." };
}

export async function recordCommitteePaymentForm(formData: FormData) {
  await recordCommitteePayment({}, formData);
}
