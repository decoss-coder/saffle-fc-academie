"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { requireFinanceManager } from "@/lib/permissions";
import { createWaveCheckout, getAppBaseUrl } from "@/lib/wave/client";
import { MIN_PAYMENT_FCFA } from "@/lib/payments/constants";
import { PLAYER_GROUPS, playersInTeam } from "@/lib/players/constants";
import { notifyPlayerStakeholders, notifyUser } from "@/lib/notifications/actions";

export type PaymentFormState = { error?: string; success?: string };

function revalidatePaymentPaths(playerId?: string) {
  revalidatePath("/dashboard/paiements");
  revalidatePath("/dashboard/paiements/historique");
  revalidatePath("/dashboard/parent/paiements");
  revalidatePath("/dashboard/player/paiements");
  if (playerId) {
    revalidatePath(`/dashboard/joueurs/${playerId}/cotisations`);
  }
  revalidatePath("/dashboard/joueurs");
}

export async function createGroupDue(
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const { user } = await requireFinanceManager();
  const supabase = await createClient();

  const teamGroup = String(formData.get("team_group") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const amount = Number(formData.get("amount_due") ?? 0);
  const dueDate = String(formData.get("due_date") ?? "") || null;

  const validTeam = PLAYER_GROUPS.some((g) => g.team === teamGroup);
  if (!validTeam || !label || amount < MIN_PAYMENT_FCFA) {
    return {
      error: "Groupe, libellé et montant (min. 100 FCFA) requis.",
    };
  }

  const groupDef = PLAYER_GROUPS.find((g) => g.team === teamGroup);
  if (!groupDef) {
    return { error: "Groupe invalide." };
  }

  const { data: players } = await supabase
    .from("players")
    .select("id, team, category")
    .eq("is_archived", false);

  const matchingPlayers = playersInTeam(players ?? [], teamGroup);

  if (!matchingPlayers.length) {
    return { error: `Aucun joueur actif dans ${teamGroup}.` };
  }

  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();

  const rows = matchingPlayers.map((player) => ({
    player_id: player.id,
    season_id: season?.id ?? null,
    due_type: "cotisation",
    label,
    amount_due: amount,
    due_date: dueDate,
    created_by: user.id,
  }));

  const { error } = await supabase.from("player_dues").insert(rows);

  if (error) {
    return { error: "Impossible de créer les cotisations." };
  }

  revalidatePaymentPaths();
  return {
    success: `${matchingPlayers.length} cotisation(s) créée(s) pour ${teamGroup} — « ${label} ».`,
  };
}

export async function createIndividualDue(
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  const { user } = await requireFinanceManager();
  const supabase = await createClient();

  const playerId = String(formData.get("player_id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const amount = Number(formData.get("amount_due") ?? 0);
  const dueDate = String(formData.get("due_date") ?? "") || null;

  if (!playerId || !label || amount < MIN_PAYMENT_FCFA) {
    return { error: "Joueur, libellé et montant requis (min. 100 FCFA)." };
  }

  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("id", playerId)
    .eq("is_archived", false)
    .maybeSingle();

  if (!player) return { error: "Joueur introuvable." };

  const { data: season } = await supabase
    .from("seasons")
    .select("id")
    .eq("is_active", true)
    .maybeSingle();

  const { error } = await supabase.from("player_dues").insert({
    player_id: playerId,
    season_id: season?.id ?? null,
    due_type: "cotisation",
    label,
    amount_due: amount,
    due_date: dueDate,
    created_by: user.id,
  });

  if (error) return { error: "Impossible de créer la cotisation." };

  revalidatePaymentPaths(playerId);
  return { success: `Cotisation « ${label} » créée.` };
}

export async function updatePlayerDue(
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  await requireFinanceManager();
  const supabase = await createClient();

  const dueId = String(formData.get("due_id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const amount = Number(formData.get("amount_due") ?? 0);
  const dueDate = String(formData.get("due_date") ?? "") || null;

  if (!dueId || !label || amount < MIN_PAYMENT_FCFA) {
    return { error: "Libellé et montant requis (min. 100 FCFA)." };
  }

  const { data: due } = await supabase
    .from("player_dues")
    .select("amount_paid, player_id, status")
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
    .from("player_dues")
    .update({
      label,
      amount_due: amount,
      due_date: dueDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", dueId);

  if (error) return { error: "Modification impossible." };

  revalidatePaymentPaths(due.player_id);
  return { success: "Cotisation mise à jour." };
}

export async function cancelPlayerDue(
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  await requireFinanceManager();
  const supabase = await createClient();

  const dueId = String(formData.get("due_id") ?? "").trim();
  if (!dueId) return { error: "Cotisation introuvable." };

  const { data: due } = await supabase
    .from("player_dues")
    .select("amount_paid, player_id, status")
    .eq("id", dueId)
    .maybeSingle();

  if (!due) return { error: "Cotisation introuvable." };
  if (Number(due.amount_paid) > 0) {
    return { error: "Impossible d'annuler une cotisation partiellement payée." };
  }

  const { count: pendingPayments } = await supabase
    .from("payments")
    .select("*", { count: "exact", head: true })
    .eq("player_due_id", dueId)
    .eq("status", "pending");

  if ((pendingPayments ?? 0) > 0) {
    return {
      error: "Annulez d'abord les paiements Wave en attente pour cette cotisation.",
    };
  }

  const { error } = await supabase
    .from("player_dues")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", dueId);

  if (error) return { error: "Annulation impossible." };

  revalidatePaymentPaths(due.player_id);
  return { success: "Cotisation annulée." };
}

export async function initiateWavePayment(formData: FormData) {
  await requireUser();
  const supabase = await createClient();
  const dueId = String(formData.get("due_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const returnPath =
    String(formData.get("return_path") ?? "") || "/dashboard/parent/paiements";

  if (!dueId || amount < MIN_PAYMENT_FCFA) {
    redirect(`${returnPath}?error=invalid_amount`);
  }

  const { data: due } = await supabase
    .from("player_dues")
    .select("id, player_id, remaining_amount, label")
    .eq("id", dueId)
    .maybeSingle();

  if (!due || amount > Number(due.remaining_amount)) {
    redirect(`${returnPath}?error=invalid_due`);
  }

  const baseUrl = getAppBaseUrl();
  const ref = `due-${dueId}-${Date.now()}`;

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

  const { data: paymentId, error } = await supabase.rpc("initiate_wave_payment", {
    p_due_id: dueId,
    p_amount: amount,
    p_wave_session_id: checkout.sessionId,
    p_wave_checkout_url: checkout.launchUrl,
  });

  if (error || !paymentId) {
    redirect(`${returnPath}?error=payment`);
  }

  revalidatePaymentPaths(due.player_id);
  redirect(checkout.launchUrl);
}

export async function confirmPayment(formData: FormData) {
  const { user } = await requireFinanceManager();
  const paymentId = String(formData.get("payment_id") ?? "");
  if (!paymentId) return;

  const supabase = await createClient();

  const { data: payment } = await supabase
    .from("payments")
    .select("id, player_id, amount, player_dues(label)")
    .eq("id", paymentId)
    .maybeSingle();

  await supabase.rpc("confirm_payment", { p_payment_id: paymentId });

  if (payment?.player_id) {
    const due = payment.player_dues as { label?: string } | { label?: string }[] | null;
    const dueLabel = Array.isArray(due) ? due[0]?.label : due?.label;
    await notifyPlayerStakeholders({
      playerId: payment.player_id,
      type: "general",
      title: "Paiement confirmé",
      body: `Votre paiement de ${Number(payment.amount).toLocaleString("fr-CI")} FCFA${dueLabel ? ` pour « ${dueLabel} »` : ""} a été confirmé par le trésorier.`,
      link: "/dashboard/parent/paiements",
      excludeUserId: user.id,
    });
  }

  revalidatePaymentPaths(payment?.player_id);
}

export async function cancelPayment(
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  await requireFinanceManager();
  const supabase = await createClient();

  const paymentId = String(formData.get("payment_id") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!paymentId || !reason) {
    return { error: "Motif d'annulation requis." };
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("player_id")
    .eq("id", paymentId)
    .maybeSingle();

  const { error } = await supabase.rpc("cancel_payment", {
    p_payment_id: paymentId,
    p_reason: reason,
  });

  if (error) return { error: "Annulation impossible." };

  revalidatePaymentPaths(payment?.player_id);
  return { success: "Paiement annulé." };
}

export async function recordManualPayment(
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  await requireFinanceManager();
  const supabase = await createClient();

  const dueId = String(formData.get("due_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("payment_method") ?? "cash");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const payerName = String(formData.get("payer_name") ?? "").trim() || null;

  if (!dueId || amount < MIN_PAYMENT_FCFA) {
    return { error: "Cotisation et montant requis (min. 100 FCFA)." };
  }

  const { data: due } = await supabase
    .from("player_dues")
    .select("player_id")
    .eq("id", dueId)
    .maybeSingle();

  const { error } = await supabase.rpc("record_manual_payment", {
    p_due_id: dueId,
    p_amount: amount,
    p_method: method,
    p_notes: notes,
    p_payer_name: payerName,
  });

  if (error) return { error: "Paiement manuel impossible." };

  revalidatePaymentPaths(due?.player_id);
  return { success: "Paiement enregistré." };
}

export async function initiateStaffWavePayment(formData: FormData) {
  await requireFinanceManager();

  const supabase = await createClient();
  const dueId = String(formData.get("due_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const playerId = String(formData.get("player_id") ?? "");

  const { data: due } = await supabase
    .from("player_dues")
    .select("id, remaining_amount, player_id")
    .eq("id", dueId)
    .maybeSingle();

  if (!due || amount < MIN_PAYMENT_FCFA || amount > Number(due.remaining_amount)) {
    redirect(`/dashboard/joueurs/${playerId || due?.player_id}/cotisations?error=invalid`);
  }

  const baseUrl = getAppBaseUrl();
  const ref = `due-${dueId}-${Date.now()}`;

  let checkout;
  try {
    checkout = await createWaveCheckout({
      amount,
      clientReference: ref,
      successUrl: `${baseUrl}/dashboard/paiements?wave=success`,
      errorUrl: `${baseUrl}/dashboard/paiements?wave=error`,
    });
  } catch {
    redirect("/dashboard/paiements?error=wave");
  }

  const { error } = await supabase.rpc("initiate_wave_payment", {
    p_due_id: dueId,
    p_amount: amount,
    p_wave_session_id: checkout.sessionId,
    p_wave_checkout_url: checkout.launchUrl,
  });

  if (error) redirect("/dashboard/paiements?error=payment");
  revalidatePaymentPaths(due.player_id);
  redirect(checkout.launchUrl);
}

export async function notifyPaymentConfirmedToPlayer(
  playerId: string,
  amount: number,
  label: string,
  excludeUserId?: string,
) {
  await notifyPlayerStakeholders({
    playerId,
    type: "general",
    title: "Paiement confirmé",
    body: `Paiement de ${amount.toLocaleString("fr-CI")} FCFA confirmé pour « ${label} ».`,
    link: "/dashboard/parent/paiements",
    excludeUserId,
  });
}

export async function notifyCommitteeMember(
  userId: string,
  title: string,
  body: string,
  link?: string,
) {
  await notifyUser({ userId, type: "general", title, body, link });
}
