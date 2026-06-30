"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  canManagePayments,
  requireTreasurer,
  requireUser,
} from "@/lib/auth";
import { createWaveCheckout, getAppBaseUrl } from "@/lib/wave/client";
import { MIN_PAYMENT_FCFA } from "@/lib/payments/constants";

export type PaymentFormState = { error?: string; success?: string };

export async function createPlayerDue(
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  await requireTreasurer();
  const supabase = await createClient();

  const playerId = String(formData.get("player_id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const amount = Number(formData.get("amount_due") ?? 0);
  const dueDate = String(formData.get("due_date") ?? "") || null;

  if (!playerId || !label || amount < MIN_PAYMENT_FCFA) {
    return { error: "Joueur, libellé et montant (min. 100 FCFA) requis." };
  }

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
    created_by: (await requireUser()).user.id,
  });

  if (error) return { error: "Impossible de créer la cotisation." };

  revalidatePath("/dashboard/paiements");
  revalidatePath("/dashboard/parent/paiements");
  return { success: "Cotisation créée." };
}

export async function initiateWavePayment(formData: FormData) {
  const { user } = await requireUser();
  const supabase = await createClient();
  const dueId = String(formData.get("due_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);

  if (!dueId || amount < MIN_PAYMENT_FCFA) {
    redirect("/dashboard/parent/paiements?error=invalid_amount");
  }

  const { data: due } = await supabase
    .from("player_dues")
    .select("id, player_id, remaining_amount, label")
    .eq("id", dueId)
    .maybeSingle();

  if (!due || amount > Number(due.remaining_amount)) {
    redirect("/dashboard/parent/paiements?error=invalid_due");
  }

  const baseUrl = getAppBaseUrl();
  const ref = `due-${dueId}-${Date.now()}`;

  let checkout;
  try {
    checkout = await createWaveCheckout({
      amount,
      clientReference: ref,
      successUrl: `${baseUrl}/dashboard/parent/paiements?wave=success`,
      errorUrl: `${baseUrl}/dashboard/parent/paiements?wave=error`,
    });
  } catch {
    redirect("/dashboard/parent/paiements?error=wave");
  }

  const { data: paymentId, error } = await supabase.rpc("initiate_wave_payment", {
    p_due_id: dueId,
    p_amount: amount,
    p_wave_session_id: checkout.sessionId,
    p_wave_checkout_url: checkout.launchUrl,
  });

  if (error || !paymentId) {
    redirect("/dashboard/parent/paiements?error=payment");
  }

  revalidatePath("/dashboard/paiements");
  revalidatePath("/dashboard/parent/paiements");
  redirect(checkout.launchUrl);
}

export async function confirmPayment(formData: FormData) {
  await requireTreasurer();
  const paymentId = String(formData.get("payment_id") ?? "");
  if (!paymentId) return;

  const supabase = await createClient();
  await supabase.rpc("confirm_payment", { p_payment_id: paymentId });

  revalidatePath("/dashboard/paiements");
  revalidatePath("/dashboard/parent/paiements");
}

export async function recordManualPayment(
  _prev: PaymentFormState,
  formData: FormData,
): Promise<PaymentFormState> {
  await requireTreasurer();
  const supabase = await createClient();

  const dueId = String(formData.get("due_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("payment_method") ?? "cash");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!dueId || amount < MIN_PAYMENT_FCFA) {
    return { error: "Cotisation et montant requis (min. 100 FCFA)." };
  }

  const { error } = await supabase.rpc("record_manual_payment", {
    p_due_id: dueId,
    p_amount: amount,
    p_method: method,
    p_notes: notes,
  });

  if (error) return { error: "Paiement manuel impossible." };

  revalidatePath("/dashboard/paiements");
  revalidatePath("/dashboard/parent/paiements");
  return { success: "Paiement enregistré." };
}

export async function initiateStaffWavePayment(formData: FormData) {
  const session = await requireUser();
  if (!canManagePayments(session.profile.role)) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const dueId = String(formData.get("due_id") ?? "");
  const amount = Number(formData.get("amount") ?? 0);

  const { data: due } = await supabase
    .from("player_dues")
    .select("id, remaining_amount")
    .eq("id", dueId)
    .maybeSingle();

  if (!due || amount < MIN_PAYMENT_FCFA || amount > Number(due.remaining_amount)) {
    redirect("/dashboard/paiements?error=invalid");
  }

  const baseUrl = getAppBaseUrl();
  const ref = `due-${dueId}-${Date.now()}`;

  const checkout = await createWaveCheckout({
    amount,
    clientReference: ref,
    successUrl: `${baseUrl}/dashboard/paiements?wave=success`,
    errorUrl: `${baseUrl}/dashboard/paiements?wave=error`,
  });

  const { error } = await supabase.rpc("initiate_wave_payment", {
    p_due_id: dueId,
    p_amount: amount,
    p_wave_session_id: checkout.sessionId,
    p_wave_checkout_url: checkout.launchUrl,
  });

  if (error) redirect("/dashboard/paiements?error=payment");
  redirect(checkout.launchUrl);
}
