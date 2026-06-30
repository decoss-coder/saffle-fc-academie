"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSalaryManager, requireSalaryViewer } from "@/lib/permissions";

export type SalaryFormState = { error?: string; success?: string };

function text(v: FormDataEntryValue | null) {
  return String(v ?? "").trim();
}

function num(v: FormDataEntryValue | null) {
  return Number(v ?? 0);
}

export async function createSalaryLine(
  _prev: SalaryFormState,
  formData: FormData,
): Promise<SalaryFormState> {
  const { user } = await requireSalaryManager();
  const supabase = await createClient();

  const phone = text(formData.get("beneficiary_phone"));
  const periodRaw = text(formData.get("period_month"));
  const periodMonth = periodRaw.includes("-") && periodRaw.length === 7
    ? `${periodRaw}-01`
    : periodRaw;
  const amount = num(formData.get("amount"));
  const label =
    text(formData.get("label")) ||
    `Indemnité ${new Date(periodMonth).toLocaleDateString("fr-CI", { month: "long", year: "numeric" })}`;

  if (!phone || !periodMonth || amount <= 0) {
    return { error: "Coach, mois et montant requis." };
  }

  const { data: coach } = await supabase
    .from("phone_registry")
    .select("phone_normalized")
    .eq("phone_normalized", phone)
    .eq("role", "coach")
    .maybeSingle();

  if (!coach) return { error: "Bénéficiaire coach introuvable." };

  const { error } = await supabase.from("staff_salary_lines").insert({
    beneficiary_phone: phone,
    label,
    period_month: periodMonth,
    amount,
    recorded_by: user.id,
  });

  if (error) return { error: "Impossible de créer la ligne." };
  revalidatePath("/dashboard/salaires");
  return { success: "Ligne salaire créée." };
}

export async function markSalaryPaid(
  _prev: SalaryFormState,
  formData: FormData,
): Promise<SalaryFormState> {
  await requireSalaryManager();
  const supabase = await createClient();

  const id = text(formData.get("line_id"));
  const method = text(formData.get("payment_method")) || "cash";
  const notes = text(formData.get("notes")) || null;

  if (!id) return { error: "Ligne introuvable." };

  const { error } = await supabase
    .from("staff_salary_lines")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      payment_method: method,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending");

  if (error) return { error: "Paiement impossible." };
  revalidatePath("/dashboard/salaires");
  return { success: "Indemnité marquée comme payée." };
}

export async function cancelSalaryLine(
  _prev: SalaryFormState,
  formData: FormData,
): Promise<SalaryFormState> {
  await requireSalaryManager();
  const supabase = await createClient();

  const id = text(formData.get("line_id"));
  if (!id) return { error: "Ligne introuvable." };

  const { error } = await supabase
    .from("staff_salary_lines")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: "Annulation impossible." };
  revalidatePath("/dashboard/salaires");
  return { success: "Ligne annulée." };
}

export async function requireSalariesPage() {
  return requireSalaryViewer();
}
