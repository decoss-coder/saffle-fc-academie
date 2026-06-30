"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";

export type PhoneRegistryState = {
  error?: string;
  success?: string;
};

const STAFF_ROLES = [
  "admin",
  "president",
  "board",
  "treasurer",
  "coach",
  "communication",
  "logistics",
] as const;

export async function registerStaffPhone(
  _prevState: PhoneRegistryState,
  formData: FormData,
): Promise<PhoneRegistryState> {
  await requireAdmin();
  const supabase = await createClient();

  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "");

  if (!phone || !fullName || !STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    return { error: "Remplissez tous les champs correctement." };
  }

  const { error } = await supabase.from("phone_registry").upsert(
    {
      phone_normalized: phone,
      role,
      full_name: fullName,
      player_id: null,
    },
    { onConflict: "phone_normalized" },
  );

  if (error) {
    return { error: "Impossible d'enregistrer ce numéro." };
  }

  revalidatePath("/dashboard/admin/telephones");
  return { success: `Numéro enregistré pour ${fullName}.` };
}
