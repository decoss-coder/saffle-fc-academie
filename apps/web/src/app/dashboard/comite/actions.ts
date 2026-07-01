"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireFinanceManager, requireCommitteeMember } from "@/lib/permissions";
import { createWaveCheckout, getAppBaseUrl } from "@/lib/wave/client";
import { MIN_PAYMENT_FCFA } from "@/lib/payments/constants";
import { COMMITTEE_ROLES } from "@/lib/budget/constants";
import { notifyUser } from "@/lib/notifications/actions";

export type ComiteFormState = { error?: string; success?: string };

function text(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

function num(v: FormDataEntryValue | null) {
  return Number(v ?? 0);
}

function revalidateComite() {
  revalidatePath("/dashboard/comite");
  revalidatePath("/dashboard/comite/mes-cotisations");
  revalidatePath("/dashboard/budget");
}

export async function createCommitteeDue(
  _prev: ComiteFormState,
  formData: FormData,
): Promise<ComiteFormState> {
  const { user } = await requireFinanceManager();
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
  revalidateComite();
  return { success: "Cotisation comité directeur créée." };
}

export async function createBulkCommitteeDue(
  _prev: ComiteFormState,
  formData: FormData,
): Promise<ComiteFormState> {
  const { user } = await requireFinanceManager();
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

  revalidateComite();
  return {
    success: `${members.length} cotisation(s) créée(s) pour le comité directeur.`,
  };
}

export async function recordCommitteePayment(
  _prev: ComiteFormState,
  formData: FormData,
): Promise<ComiteFormState> {
  const { user } = await requireFinanceManager();
  const supabase = await createClient();

  const dueId = text(formData.get("committee_due_id"));
  const amount = num(formData.get("amount"));
  const linkBudget = formData.get("link_budget") === "on";

  if (!dueId || amount < MIN_PAYMENT_FCFA) {
    return { error: "Montant invalide." };
  }

  const { data: due } = await supabase
    .from("committee_dues")
    .select("*, phone_registry(full_name, position_title, linked_user_id)")
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
      status: "completed",
      notes: text(formData.get("notes")) || null,
      recorded_by: user.id,
      receipt_number: `REC-C-${Date.now().toString(36).toUpperCase()}`,
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
      const member = due.phone_registry as {
        full_name?: string;
        position_title?: string;
      } | null;
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

  const registry = due.phone_registry as { linked_user_id?: string } | null;
  if (registry?.linked_user_id) {
    await notifyUser({
      userId: registry.linked_user_id,
      type: "general",
      title: "Cotisation comité enregistrée",
      body: `Paiement de ${amount.toLocaleString("fr-CI")} FCFA confirmé pour « ${due.label} ».`,
      link: "/dashboard/comite/mes-cotisations",
    });
  }

  revalidateComite();
  return { success: "Paiement comité enregistré." };
}

export async function confirmCommitteePayment(formData: FormData) {
  await requireFinanceManager();
  const paymentId = text(formData.get("payment_id"));
  if (!paymentId) return;

  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("committee_due_payments")
    .select("id, amount, committee_due_id, committee_dues(label, member_phone, phone_registry(linked_user_id))")
    .eq("id", paymentId)
    .maybeSingle();

  await supabase.rpc("confirm_committee_payment", { p_payment_id: paymentId });

  const due = payment?.committee_dues as {
    label?: string;
    phone_registry?: { linked_user_id?: string } | { linked_user_id?: string }[] | null;
  } | null;
  const registry = Array.isArray(due?.phone_registry)
    ? due.phone_registry[0]
    : due?.phone_registry;
  if (registry?.linked_user_id && payment) {
    await notifyUser({
      userId: registry.linked_user_id,
      type: "general",
      title: "Paiement Wave confirmé",
      body: `Votre paiement de ${Number(payment.amount).toLocaleString("fr-CI")} FCFA pour « ${due?.label ?? "cotisation comité"} » a été confirmé.`,
      link: "/dashboard/comite/mes-cotisations",
    });
  }

  revalidateComite();
}

export async function initiateCommitteeWavePayment(formData: FormData) {
  await requireCommitteeMember();
  const supabase = await createClient();

  const dueId = text(formData.get("due_id"));
  const amount = num(formData.get("amount"));
  const returnPath =
    text(formData.get("return_path")) || "/dashboard/comite/mes-cotisations";

  if (!dueId || amount < MIN_PAYMENT_FCFA) {
    redirect(`${returnPath}?error=invalid_amount`);
  }

  const baseUrl = getAppBaseUrl();
  const ref = `comite-${dueId}-${Date.now()}`;

  let checkout;
  try {
    checkout = await createWaveCheckout({
      amount,
      clientReference: ref,
      successUrl: `${baseUrl}${returnPath}?wave=success`,
      errorUrl: `${baseUrl}${returnPath}?wave=error`,
    });
  } catch {
    redirect(`${returnPath}?error=wave`);
  }

  const { error } = await supabase.rpc("initiate_committee_wave_payment", {
    p_due_id: dueId,
    p_amount: amount,
    p_wave_session_id: checkout.sessionId,
    p_wave_checkout_url: checkout.launchUrl,
  });

  if (error) redirect(`${returnPath}?error=payment`);
  revalidateComite();
  redirect(checkout.launchUrl);
}

export async function cancelCommitteePayment(
  _prev: ComiteFormState,
  formData: FormData,
): Promise<ComiteFormState> {
  await requireFinanceManager();
  const supabase = await createClient();

  const paymentId = text(formData.get("payment_id"));
  const reason = text(formData.get("reason"));

  if (!paymentId || !reason) return { error: "Motif requis." };

  const { error } = await supabase.rpc("cancel_committee_payment", {
    p_payment_id: paymentId,
    p_reason: reason,
  });

  if (error) return { error: "Annulation impossible." };
  revalidateComite();
  return { success: "Paiement annulé." };
}

export async function updateCommitteeDue(
  _prev: ComiteFormState,
  formData: FormData,
): Promise<ComiteFormState> {
  await requireFinanceManager();
  const supabase = await createClient();

  const dueId = text(formData.get("due_id"));
  const label = text(formData.get("label"));
  const amount = num(formData.get("amount_due"));
  const dueDate = text(formData.get("due_date")) || null;

  if (!dueId || !label || amount < MIN_PAYMENT_FCFA) {
    return { error: "Libellé et montant requis." };
  }

  const { data: due } = await supabase
    .from("committee_dues")
    .select("amount_paid, status")
    .eq("id", dueId)
    .maybeSingle();

  if (!due) return { error: "Cotisation introuvable." };
  if (Number(due.amount_paid) > 0) {
    return { error: "Impossible de modifier une cotisation déjà payée." };
  }
  if (due.status === "cancelled" || due.status === "paid") {
    return { error: "Cette cotisation n'est plus modifiable." };
  }

  const { error } = await supabase
    .from("committee_dues")
    .update({
      label,
      amount_due: amount,
      due_date: dueDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dueId);

  if (error) return { error: "Modification impossible." };
  revalidateComite();
  return { success: "Cotisation mise à jour." };
}

export async function cancelCommitteeDue(
  _prev: ComiteFormState,
  formData: FormData,
): Promise<ComiteFormState> {
  await requireFinanceManager();
  const supabase = await createClient();

  const dueId = text(formData.get("due_id"));
  if (!dueId) return { error: "Cotisation introuvable." };

  const { data: due } = await supabase
    .from("committee_dues")
    .select("amount_paid, status")
    .eq("id", dueId)
    .maybeSingle();

  if (!due) return { error: "Cotisation introuvable." };
  if (Number(due.amount_paid) > 0) {
    return { error: "Impossible d'annuler une cotisation partiellement payée." };
  }

  const { error } = await supabase
    .from("committee_dues")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", dueId);

  if (error) return { error: "Annulation impossible." };
  revalidateComite();
  return { success: "Cotisation annulée." };
}
